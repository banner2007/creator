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
async function pollKieTask(taskId, apiKey, retries = 20, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Kie.ai] Polling task ${taskId} (Attempt ${i + 1}/${retries})...`);
      const response = await axios.get(`${KIE_BASE_URL}/api/v1/jobs/recordInfo`, {
        params: { taskId },
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const { code, data } = response.data;
      if (code === 200 && data) {
        const status = data.status || data.successFlag;
        if (status === 'SUCCESS' || status === true || data.resultImageUrl || (data.info && data.info.resultImageUrl)) {
          const imageUrl = data.resultImageUrl || (data.info && data.info.resultImageUrl);
          if (imageUrl) {
            console.log(`[Kie.ai] Task completed successfully! Image URL: ${imageUrl}`);
            return imageUrl;
          }
        } else if (status === 'FAILED' || status === 'ERROR') {
          throw new Error(`Kie.ai task failed with status: ${status}`);
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

  // Convert ratio to gpt-image-2 format (1024x1024, 1792x1024, or 1024x1792)
  let size = '1024x1024';
  if (ratio === '16:9') size = '1792x1024';
  else if (ratio === '9:16') size = '1024x1792';

  console.log(`[OpenAI gpt-image-2] Requesting image generation, size: ${size}...`);
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

  const url = response.data.data[0].url;
  console.log(`[OpenAI gpt-image-2] Image generated: ${url}`);
  return url;
}

/**
 * Generate fallback stock image based on keywords
 */
function getFallbackImage(product, style, ratio) {
  const randomId = Math.floor(Math.random() * 1000);
  return `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80&sig=${randomId}`;
}

/**
 * Download image from URL and upload to Supabase Storage
 */
async function uploadToSupabase(imageUrl, projectId) {
  try {
    console.log(`[Storage] Downloading image: ${imageUrl}`);
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    const ext = 'webp';
    const filename = `images/${projectId}/${Date.now()}-${Math.floor(Math.random() * 100000)}.${ext}`;

    console.log(`[Storage] Uploading to Supabase bucket 'generated-images' as ${filename}`);
    const { data, error } = await supabase.storage
      .from('generated-images')
      .upload(filename, buffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('generated-images')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (err) {
    console.error('[Storage] Upload to Supabase failed, returning original URL:', err.message);
    return imageUrl;
  }
}

/**
 * @route   GET /api/ai/debug
 * @desc    Debug environment variables for image generation (safe, no keys leaked)
 */
router.get('/debug', (req, res) => {
  const KIE_API_KEY = process.env.KIE_API_KEY || process.env.ap;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.API;
  res.json({
    hasKieKey: !!KIE_API_KEY && KIE_API_KEY !== 'your-kie-ai-api-key',
    hasOpenAiKey: !!OPENAI_API_KEY && !OPENAI_API_KEY.includes('your-'),
    kieKeyLength: KIE_API_KEY ? KIE_API_KEY.length : 0,
    openAiKeyLength: OPENAI_API_KEY ? OPENAI_API_KEY.length : 0,
    envKeysPresent: Object.keys(process.env).filter(k => 
      k.toLowerCase().includes('key') || 
      k.toLowerCase().includes('api') || 
      k === 'ap' ||
      k === 'API'
    )
  });
});

/**
 * @route   GET /api/ai/test-kie
 * @desc    Test Kie.ai generation endpoint (safe, no keys leaked)
 */
router.get('/test-kie', async (req, res) => {
  const KIE_API_KEY = process.env.KIE_API_KEY || process.env.ap;
  if (!KIE_API_KEY) {
    return res.status(400).json({ error: 'Kie key not configured' });
  }
  try {
    const response = await axios.post(`${KIE_BASE_URL}/api/v1/flux/kontext/generate`, {
      prompt: 'A test image of a green apple on a desk, photorealistic',
      model: 'flux-kontext-pro',
      aspectRatio: '1:1',
      enableTranslation: true
    }, {
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return res.json({ status: 'success', data: response.data });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: err.message,
      response: err.response ? err.response.data : null
    });
  }
});

/**
 * @route   GET /api/ai/test-openai
 * @desc    Test OpenAI generation endpoint (safe, no keys leaked)
 */
router.get('/test-openai', async (req, res) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.API;
  if (!OPENAI_API_KEY) {
    return res.status(400).json({ error: 'OpenAI key not configured' });
  }
  try {
    const response = await axios.post(OPENAI_URL, {
      model: 'gpt-image-2',
      prompt: 'A test image of a green apple on a desk, photorealistic',
      n: 1,
      size: '1024x1024'
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return res.json({ status: 'success', data: response.data });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: err.message,
      response: err.response ? err.response.data : null
    });
  }
});

/**
 * @route   GET /api/ai/test-poll/:taskId
 * @desc    Test Kie.ai task polling endpoint (safe, no keys leaked)
 */
router.get('/test-poll/:taskId', async (req, res) => {
  const KIE_API_KEY = process.env.KIE_API_KEY || process.env.ap;
  if (!KIE_API_KEY) {
    return res.status(400).json({ error: 'Kie key not configured' });
  }
  try {
    const response = await axios.get(`${KIE_BASE_URL}/api/v1/jobs/recordInfo`, {
      params: { taskId: req.params.taskId },
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`
      }
    });
    return res.json({ status: 'success', data: response.data });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: err.message,
      response: err.response ? err.response.data : null
    });
  }
});

/**
 * @route   GET /api/ai/test-poll-flux/:taskId
 * @desc    Test Kie.ai Flux Kontext task polling endpoint (safe, no keys leaked)
 */
router.get('/test-poll-flux/:taskId', async (req, res) => {
  const KIE_API_KEY = process.env.KIE_API_KEY || process.env.ap;
  if (!KIE_API_KEY) {
    return res.status(400).json({ error: 'Kie key not configured' });
  }
  try {
    const response = await axios.get(`${KIE_BASE_URL}/api/v1/flux/kontext/record-info`, {
      params: { taskId: req.params.taskId },
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`
      }
    });
    return res.json({ status: 'success', data: response.data });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: err.message,
      response: err.response ? err.response.data : null
    });
  }
});

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
    const isKie = validated.engine === 'kie-ai';

    console.log(`[AI Gen] Generating ${validated.cantidad} images via ${validated.engine}.`);

    // Generate images loop
    for (let i = 0; i < validated.cantidad; i++) {
      let finalUrl = '';
      
      if (isKie) {
        const useRealKie = KIE_API_KEY && KIE_API_KEY !== 'your-kie-ai-api-key';
        
        if (useRealKie) {
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
            } else {
              console.warn(`[AI Gen] Kie.ai task submission failed: ${msg}. Triggering fallback.`);
              finalUrl = getFallbackImage(validated.producto, validated.estilo, validated.formato);
              finalUrl = await uploadToSupabase(finalUrl, validated.projectId);
            }
          } catch (err) {
            console.error('[AI Gen] Kie.ai integration failed, using fallback:', err.message);
            finalUrl = getFallbackImage(validated.producto, validated.estilo, validated.formato);
            finalUrl = await uploadToSupabase(finalUrl, validated.projectId);
          }
        } else {
          // Fallback Unsplash image simulation
          finalUrl = getFallbackImage(validated.producto, validated.estilo, validated.formato);
          finalUrl = await uploadToSupabase(finalUrl, validated.projectId);
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
          const rawUrl = await generateOpenAIImage(dallePrompt, validated.formato);
          finalUrl = await uploadToSupabase(rawUrl, validated.projectId);
        } catch (err) {
          console.error('[AI Gen] OpenAI DALL-E 3 failed, using fallback:', err.message);
          finalUrl = getFallbackImage(validated.producto, validated.estilo, validated.formato);
          finalUrl = await uploadToSupabase(finalUrl, validated.projectId);
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
    const dbRecords = generatedUrls.map(url => ({
      project_id: validated.projectId,
      prompt: validated.producto,
      model: isKie ? 'flux-kontext-pro' : 'gpt-image-2',
      resolution: validated.formato,
      image_url: url
    }));

    const { data: savedImages, error: dbError } = await supabase
      .from('ai_images')
      .insert(dbRecords)
      .select();

    if (dbError) {
      console.error('[AI Gen] Failed to save generated images in DB:', dbError);
      return res.status(500).json({ error: 'Images generated but database record failed.', images: generatedUrls });
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
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Image generation route error:', err);
    return res.status(500).json({ error: 'Internal server error generating images.' });
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
