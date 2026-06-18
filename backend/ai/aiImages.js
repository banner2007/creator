import { Router } from 'express';
import { supabaseAdmin as supabase } from '../server.js';
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
 * Clean product prompt by removing large non-visual description texts
 */
function cleanProductPrompt(rawPrompt) {
  if (!rawPrompt) return '';
  
  if (!rawPrompt.toLowerCase().includes('product:')) {
    return rawPrompt.trim();
  }

  const keys = [
    { name: 'product', patterns: [/product:/i] },
    { name: 'bgColor', patterns: [/background color:/i] },
    { name: 'styleContext', patterns: [/style context:/i, /referencing selected/i] },
    { name: 'extraStyle', patterns: [/additional style directions:/i, /style customization:/i] },
    { name: 'description', patterns: [/description:/i] }
  ];

  const matches = [];
  
  keys.forEach(k => {
    k.patterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      let match;
      while ((match = regex.exec(rawPrompt)) !== null) {
        matches.push({
          name: k.name,
          index: match.index,
          length: match[0].length
        });
      }
    });
  });

  matches.sort((a, b) => a.index - b.index);

  const values = {};
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = (i + 1 < matches.length) ? matches[i + 1].index : rawPrompt.length;
    const value = rawPrompt.substring(current.index + current.length, nextIndex).trim();
    
    let cleanVal = value.replace(/^[:\s\.-]+|[:\s\.-]+$/g, '').trim();
    if (cleanVal) {
      if (rawPrompt.substring(current.index, current.index + current.length).toLowerCase().includes('referencing selected')) {
        cleanVal = rawPrompt.substring(current.index, nextIndex).trim().replace(/[:\s\.-]+$/g, '').trim();
      }
      values[current.name] = cleanVal;
    }
  }

  let cleanedParts = [];
  if (values.product) cleanedParts.push(values.product);
  if (values.bgColor) cleanedParts.push(`Background color: ${values.bgColor}`);
  if (values.styleContext) cleanedParts.push(values.styleContext);
  if (values.extraStyle) cleanedParts.push(`Style directions: ${values.extraStyle}`);
  
  if (cleanedParts.length === 0) {
    return rawPrompt.trim();
  }

  return cleanedParts.join('. ') + '.';
}

/**
 * Analyze product image using gpt-4o-mini to get a visual description
 */
async function describeProductImage(imageUrl) {
  if (!imageUrl) return '';
  try {
    console.log(`[Vision] Analyzing product image using gpt-4o-mini: ${imageUrl}`);
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe the main product in this image in detail. Focus on the shape of the bottle/container, its color (e.g. black, white, glass, etc.), the label design, colors on the label, cap color, and logo. Keep it concise (1-2 sentences in English) suitable for a text-to-image prompt.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 100
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const description = response.data?.choices?.[0]?.message?.content;
    console.log(`[Vision] Product description: ${description}`);
    return description ? description.trim() : '';
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.warn('[Vision] Failed to analyze product image:', errorMsg);
    return '';
  }
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
      size: size
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
    console.error('[Storage] Upload to Supabase failed:', err.message);
    throw new Error(`Fallo al subir a Supabase Storage: ${err.message}`);
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

    // Clean product prompt and retrieve its visual description from image once
    const cleanedProduct = cleanProductPrompt(validated.producto);
    const productDescription = await describeProductImage(validated.productImage);

    console.log(`[AI Gen] Cleaned product description for AI engines: "${cleanedProduct}"`);
    if (productDescription) {
      console.log(`[AI Gen] Visual product description from image: "${productDescription}"`);
    }

    // Generate images loop
    for (let i = 0; i < validated.cantidad; i++) {
      let finalUrl = '';
      
      if (isKie) {
        try {
          // Build rich prompt based on user instructions
          let prompt = `Create a premium high-end commercial advertising image for ${cleanedProduct} using the uploaded images.

INPUTS:

1. PRODUCT_IMAGES = one or more uploaded images of the real product (PRIMARY SOURCE OF TRUTH).
${productDescription ? `The visual appearance of PRODUCT_IMAGES is described as: ${productDescription}.` : ''}
2. REFERENCE_IMAGE = uploaded sample advertisement image (STYLE AND COMPOSITION REFERENCE ONLY).

OBJECTIVE:
Generate a commercial advertising banner that preserves the exact real product from PRODUCT_IMAGES while reproducing the visual language of REFERENCE_IMAGE.

REFERENCE IMAGE INSTRUCTIONS:
Analyze and transfer ONLY:
* composition
* camera framing
* scene structure
* lighting style
* shadows
* reflections
* color atmosphere
* background style
* typography placement
* premium advertising feel

DO NOT transfer from REFERENCE_IMAGE:
* product shape
* packaging
* labels
* logo
* physical objects
* textures applied to the product
* colors of the product
* dimensions
* materials
* decorative product elements

PRODUCT PRESERVATION (HIGHEST PRIORITY):
Use PRODUCT_IMAGES as the exact object to appear in the final advertisement.

The product shown in PRODUCT_IMAGES is immutable.

Render the exact uploaded product:
* preserve original geometry
* preserve exact proportions
* preserve original colors
* preserve labels exactly
* preserve logo exactly
* preserve packaging exactly
* preserve surface textures
* preserve cap, handles, wheels, accessories and physical details
* preserve all visible design elements

Never:
* redesign
* reinterpret
* recreate
* approximate
* replace
* stylize
* simplify
* generate alternate packaging
* generate a different version

If multiple PRODUCT_IMAGES are provided:
combine all views to reconstruct the same real product accurately.

COMPOSITION RULE:
Place the exact preserved product into a scene that follows the composition and visual direction of REFERENCE_IMAGE.

If any conflict exists between REFERENCE_IMAGE and PRODUCT_IMAGES:
ALWAYS preserve PRODUCT_IMAGES.

FINAL OUTPUT:
Professional advertising banner.
Theme: ${validated.estilo}
Photorealistic.
Commercial studio quality.
Luxury presentation.
High-end advertising aesthetics.
Ultra detailed.
8k quality.
Masterfully lit.
Extremely sharp focus.
Product identity similarity target: 98–100%.`;

          if (validated.referenceImage) {
            prompt += `\n\nReference Image URL: ${validated.referenceImage}`;
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
          let dallePrompt = `Create a premium high-end commercial advertising image for ${cleanedProduct} using the uploaded images.

INPUTS:

1. PRODUCT_IMAGES = one or more uploaded images of the real product (PRIMARY SOURCE OF TRUTH).
${productDescription ? `The visual appearance of PRODUCT_IMAGES is described as: ${productDescription}.` : ''}
2. REFERENCE_IMAGE = uploaded sample advertisement image (STYLE AND COMPOSITION REFERENCE ONLY).

OBJECTIVE:
Generate a commercial advertising banner that preserves the exact real product from PRODUCT_IMAGES while reproducing the visual language of REFERENCE_IMAGE.

REFERENCE IMAGE INSTRUCTIONS:
Analyze and transfer ONLY:
* composition
* camera framing
* scene structure
* lighting style
* shadows
* reflections
* color atmosphere
* background style
* typography placement
* premium advertising feel

DO NOT transfer from REFERENCE_IMAGE:
* product shape
* packaging
* labels
* logo
* physical objects
* textures applied to the product
* colors of the product
* dimensions
* materials
* decorative product elements

PRODUCT PRESERVATION (HIGHEST PRIORITY):
Use PRODUCT_IMAGES as the exact object to appear in the final advertisement.

The product shown in PRODUCT_IMAGES is immutable.

Render the exact uploaded product:
* preserve original geometry
* preserve exact proportions
* preserve original colors
* preserve labels exactly
* preserve logo exactly
* preserve packaging exactly
* preserve surface textures
* preserve cap, handles, wheels, accessories and physical details
* preserve all visible design elements

Never:
* redesign
* reinterpret
* recreate
* approximate
* replace
* stylize
* simplify
* generate alternate packaging
* generate a different version

If multiple PRODUCT_IMAGES are provided:
combine all views to reconstruct the same real product accurately.

COMPOSITION RULE:
Place the exact preserved product into a scene that follows the composition and visual direction of REFERENCE_IMAGE.

If any conflict exists between REFERENCE_IMAGE and PRODUCT_IMAGES:
ALWAYS preserve PRODUCT_IMAGES.

FINAL OUTPUT:
Professional advertising banner.
Theme: ${validated.estilo}
Photorealistic.
Commercial studio quality.
Luxury presentation.
High-end advertising aesthetics.
Ultra detailed.
8k quality.
Masterfully lit.
Extremely sharp focus.
Product identity similarity target: 98–100%.`;

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
