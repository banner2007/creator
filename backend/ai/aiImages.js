import { Router } from 'express';
import { supabase } from '../server.js';
import { requireAuth } from '../middleware/auth.js';
import axios from 'axios';
import { z } from 'zod';

const router = Router();

// Retrieve API keys from env
const KIE_API_KEY = process.env.KIE_API_KEY || process.env.ap;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.API;

const KIE_BASE_URL = 'https://api.kie.ai';
const OPENAI_URL = 'https://api.openai.com/v1/images/generations';

// Validation Schema
const generateSchema = z.object({
  producto: z.string().min(1),
  estilo: z.string().default('premium'),
  formato: z.string().default('16:9'),
  cantidad: z.number().min(1).max(4).default(1),
  projectId: z.string().uuid(),
  engine: z.enum(['kie-ai', 'openai']).default('kie-ai'),
  referenceImage: z.string().optional(),
  productImage: z.string().optional(),
  calidad: z.enum(['bajo', 'medio', 'alto']).default('medio')
});

/**
 * Poll Kie.ai task until completion
 */
async function pollKieTask(taskId, apiKey, retries = 25, delayMs = 3000) {
  const isFlux = taskId.startsWith('fluxkontext');
  const endpoint = isFlux 
    ? `${KIE_BASE_URL}/api/v1/flux/kontext/record-info`
    : `${KIE_BASE_URL}/api/v1/jobs/recordInfo`;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Kie.ai] Polling task ${taskId} (Attempt ${i + 1}/${retries}) at ${endpoint}...`);
      const response = await axios.get(endpoint, {
        params: { taskId },
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const { code, data } = response.data;
      if (code === 200 && data) {
        const success = data.successFlag === 1 || data.successFlag === true || data.status === 'SUCCESS';
        if (success) {
          const imageUrl = data.resultImageUrl || 
                           (data.response && data.response.resultImageUrl) || 
                           (data.info && data.info.resultImageUrl);
          if (imageUrl) {
            console.log(`[Kie.ai] Task completed successfully! Image URL: ${imageUrl}`);
            return imageUrl;
          }
        } else if (data.status === 'FAILED' || data.status === 'ERROR' || data.errorCode) {
          throw new Error(`Kie.ai task failed with error: ${data.errorMessage || data.status}`);
        }
      }
    } catch (error) {
      console.error(`[Kie.ai] Polling error on attempt ${i + 1}:`, error.message);
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error('Kie.ai task polling timed out.');
}

/**
 * Generate image using OpenAI gpt-image-2 (ChatGPT Imagen 2.0)
 */
async function generateOpenAIImage(prompt, ratio) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your-')) {
    throw new Error('OpenAI API Key is missing or invalid in server config.');
  }

  // Convert ratio to dimensions
  let size = '1024x1024';
  if (ratio === '16:9') size = '1792x1024';
  else if (ratio === '9:16') size = '1024x1792';

  // 1. Try to generate with gpt-image-2 (ChatGPT Imagen 2.0)
  try {
    console.log(`[OpenAI] Trying to generate with gpt-image-2, size: ${size}...`);
    const response = await axios.post(OPENAI_URL, {
      model: 'gpt-image-2',
      prompt: prompt,
      n: 1,
      size: size,
      response_format: 'b64_json' // gpt-image-2 prefers base64
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const urlOrB64 = response.data?.data?.[0]?.b64_json || response.data?.data?.[0]?.url;
    if (!urlOrB64) throw new Error('No image URL or Base64 returned from gpt-image-2');
    console.log(`[OpenAI gpt-image-2] Generation succeeded!`);
    return { url: urlOrB64, model: 'gpt-image-2' };
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.warn(`[OpenAI] gpt-image-2 failed: ${errorMsg}. Falling back to dall-e-3...`);
    
    // 2. Fallback to dall-e-3
    const response = await axios.post(OPENAI_URL, {
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: size
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const url = response.data?.data?.[0]?.url;
    if (!url) throw new Error('No image URL returned from dall-e-3 fallback');
    console.log(`[OpenAI dall-e-3] Fallback generation succeeded!`);
    return { url, model: 'dall-e-3' };
  }
}

/**
 * Generate fallback stock image based on keywords
 */
function getFallbackImage(product, style, ratio) {
  const randomId = Math.floor(Math.random() * 1000);
  const keywords = encodeURIComponent((product || 'product').replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).slice(0, 3).join(','));
  return `https://images.unsplash.com/featured/800x800/?${keywords}&sig=${randomId}`;
}

/**
 * Download image from URL or parse base64 and upload to Supabase Storage
 */
async function uploadToSupabase(imageUrl, projectId) {
  try {
    if (!imageUrl) throw new Error('No image content to upload');
    
    let buffer;
    let contentType = 'image/webp';

    const isUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
    
    if (isUrl) {
      console.log(`[Storage] Downloading image from URL: ${imageUrl}`);
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      buffer = Buffer.from(response.data, 'binary');
    } else {
      console.log(`[Storage] Handling base64 image data`);
      const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contentType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        // Raw base64 string
        buffer = Buffer.from(imageUrl, 'base64');
      }
    }

    const ext = contentType.split('/')[1] || 'webp';
    const filename = `images/${projectId}/${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;

    console.log(`[Storage] Uploading to Supabase bucket 'generated-images' as ${filename}`);
    const { data, error } = await supabase.storage
      .from('generated-images')
      .upload(filename, buffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('generated-images')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (err) {
    console.error('[Storage] Upload to Supabase failed, returning original URL/Base64 stub:', err.message);
    // Return original image URL if it's a URL, or null if it's raw base64 (to avoid inserting huge base64 into DB)
    return imageUrl.length < 2000 ? imageUrl : null;
  }
}



/**
 * @route   POST /api/ai/generate
 * @desc    Generate commercial product images using Kie.ai or OpenAI DALL-E 3
 */
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const validated = generateSchema.parse(req.body);
    const userId = req.user.id;

    // 1. Check user credits
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    if (profile.credits < validated.cantidad) {
      return res.status(400).json({ error: `Insufficient credits. Required: ${validated.cantidad}, Available: ${profile.credits}` });
    }

    const generatedUrls = [];
    const modelsUsed = [];
    const isKie = validated.engine === 'kie-ai';

    console.log(`[AI Gen] Generating ${validated.cantidad} images via ${validated.engine}.`);

    // Verify key existence early to prevent wasting user time/credits
    if (isKie) {
      const useRealKie = KIE_API_KEY && KIE_API_KEY !== 'your-kie-ai-api-key';
      if (!useRealKie) {
        return res.status(400).json({ error: 'La clave de API de Kie.ai (KIE_API_KEY / ap) no está configurada o es inválida en el servidor. Por favor confígurela en Hostinger/Render.' });
      }
    } else {
      const useRealOpenAI = OPENAI_API_KEY && !OPENAI_API_KEY.includes('your-');
      if (!useRealOpenAI) {
        return res.status(400).json({ error: 'La clave de API de OpenAI (OPENAI_API_KEY / API) no está configurada o es inválida en el servidor. Por favor agréguela en las variables de entorno de Render.' });
      }
    }

    // Generate images loop
    for (let i = 0; i < validated.cantidad; i++) {
      let finalUrl = '';
      
      if (isKie) {
        try {
          // Build rich prompt for Kie.ai Flux Kontext style transfer
          let prompt = `A premium professional commercial product photo of ${validated.producto}, styled in a ${validated.estilo} theme, studio lighting, photorealistic, product advertisement, highly detailed.`;
          if (validated.calidad === 'bajo') {
            prompt += ` Draft quality, simple details, quick capture.`;
          } else if (validated.calidad === 'alto') {
            prompt += ` Ultra high quality, professional commercial photography, 8k resolution, masterfully lit, award-winning advertisement look, photorealistic, sharp focus.`;
          } else {
            prompt += ` Medium quality, standard studio commercial lighting.`;
          }

          if (validated.referenceImage) {
            prompt += ` Match composition, background colors and style of the reference image: ${validated.referenceImage}.`;
          }

          console.log(`[Kie.ai] Submitting job with prompt: ${prompt}`);
          const payload = {
            prompt: prompt,
            model: 'flux-kontext-pro',
            aspectRatio: validated.formato,
            enableTranslation: true
          };
          if (validated.productImage) {
            payload.inputImage = validated.productImage;
          }

          const response = await axios.post(`${KIE_BASE_URL}/api/v1/flux/kontext/generate`, payload, {
            headers: {
              'Authorization': `Bearer ${KIE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });

          const { code, data, msg } = response.data;
          if (code === 200 && data?.taskId) {
            const rawUrl = await pollKieTask(data.taskId, KIE_API_KEY);
            finalUrl = await uploadToSupabase(rawUrl, validated.projectId);
            modelsUsed.push('flux-kontext-pro');
          } else {
            console.error(`[AI Gen] Kie.ai task submission failed: ${msg}`);
            return res.status(400).json({ error: `Fallo al iniciar tarea de Kie.ai: ${msg || 'Error desconocido'}` });
          }
        } catch (err) {
          const detail = err.response?.data?.error?.message || err.message;
          console.error('[AI Gen] Kie.ai integration failed:', detail);
          return res.status(500).json({ error: `Error durante la generación con Kie.ai: ${detail}` });
        }
      } else {
        // OpenAI gpt-image-2 generation
        try {
          let dallePrompt = `A high-end commercial ad banner for ${validated.producto}. Theme: ${validated.estilo}. Studio lighting, professional layout, clean design, highly detailed, centered product focus, commercial photography.`;
          if (validated.calidad === 'bajo') {
            dallePrompt += ` Draft quality, simple background.`;
          } else if (validated.calidad === 'alto') {
            dallePrompt += ` Ultra high quality, professional studio setup, 8k resolution, award-winning commercial layout, masterfully lit, photorealistic, extremely sharp focus.`;
          } else {
            dallePrompt += ` Medium quality, standard studio lighting.`;
          }
          const { url, model } = await generateOpenAIImage(dallePrompt, validated.formato);
          finalUrl = await uploadToSupabase(url, validated.projectId);
          modelsUsed.push(model);
        } catch (err) {
          const detail = err.response?.data?.error?.message || err.message;
          console.error('[AI Gen] OpenAI generation failed:', detail);
          return res.status(500).json({ error: `Error durante la generación con OpenAI: ${detail}` });
        }
      }
      
      generatedUrls.push(finalUrl);
    }

    // 2. Deduct credits
    const newCredits = profile.credits - validated.cantidad;
    await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId);

    // 3. Save to database
    const dbRecords = generatedUrls.map((url, index) => ({
      project_id: validated.projectId,
      prompt: validated.producto,
      model: modelsUsed[index] || (isKie ? 'flux-kontext-pro' : 'dall-e-3'),
      resolution: validated.formato,
      image_url: url
    }));

    const { data: savedImages, error: dbError } = await supabase
      .from('ai_images')
      .insert(dbRecords)
      .select();

    if (dbError) {
      console.error('[AI Gen] Failed to save generated images in DB:', dbError);
      return res.status(500).json({ error: `Imágenes creadas pero falló el registro en la base de datos: ${dbError.message || JSON.stringify(dbError)}`, images: generatedUrls });
    }

    // 4. Log Action
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'generate_images',
      metadata: {
        product: validated.producto,
        count: validated.cantidad,
        engine: validated.engine,
        credits_spent: validated.cantidad,
        remaining_credits: newCredits
      }
    });

    return res.json({
      success: true,
      images: savedImages,
      creditsLeft: newCredits
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Error de validación de parámetros', details: err.errors });
    }
    console.error('Image generation route error:', err);
    return res.status(500).json({ error: 'Error interno del servidor al generar imágenes.' });
  }
});

/**
 * @route   GET /api/ai/project/:projectId
 * @desc    Fetch all AI generated images for a project
 */
router.get('/project/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const { data, error } = await supabase
      .from('ai_images')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error('Fetch project images error:', err);
    return res.status(500).json({ error: 'Internal server error fetching project images.' });
  }
});

/**
 * @route   POST /api/ai/remove-bg
 * @desc    Mock background removal
 */
router.post('/remove-bg', requireAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

    await new Promise(resolve => setTimeout(resolve, 1500));

    return res.json({
      success: true,
      resultUrl: imageUrl,
      message: 'Background removed successfully (Simulated)'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Background removal failed.' });
  }
});

/**
 * @route   POST /api/ai/upscale
 * @desc    Mock upscale image
 */
router.post('/upscale', requireAuth, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

    await new Promise(resolve => setTimeout(resolve, 1500));

    return res.json({
      success: true,
      resultUrl: imageUrl,
      message: 'Image upscaled to 4K successfully (Simulated)'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Image upscale failed.' });
  }
});

export default router;
