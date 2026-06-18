import { Router } from 'express';
import { supabaseAdmin as supabase } from '../server.js';
import { requireAuth } from '../middleware/auth.js';
import axios from 'axios';
import { z } from 'zod';
import FormData from 'form-data';

const router = Router();

// Retrieve API keys from env
const KIE_API_KEY = process.env.KIE_API_KEY || process.env.ap;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.API;

const KIE_BASE_URL = 'https://api.kie.ai';
// IMPORTANTE: usamos el endpoint de EDITS (image-to-image), no GENERATIONS (text-to-image).
// /v1/images/generations NO acepta imágenes de entrada: el modelo "inventa" un producto
// nuevo a partir solo del texto del prompt, que es la causa raíz de que el producto cambie.
// /v1/images/edits sí recibe las imágenes reales como archivos y edita/compone sobre ellas.
const OPENAI_EDITS_URL = 'https://api.openai.com/v1/images/edits';

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
 * Download an image (URL or base64 data URL) into a Buffer + mime type,
 * ready to be attached as a file in a multipart/form-data request.
 */
async function fetchImageAsBuffer(imageSource) {
  if (!imageSource) return null;

  if (imageSource.startsWith('data:')) {
    const matches = imageSource.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    if (!matches) throw new Error('Formato de data URL base64 inválido');
    return { buffer: Buffer.from(matches[2], 'base64'), mimeType: matches[1] };
  }

  if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
    const response = await axios.get(imageSource, { responseType: 'arraybuffer' });
    const mimeType = response.headers['content-type'] || 'image/png';
    return { buffer: Buffer.from(response.data, 'binary'), mimeType };
  }

  // Raw base64 sin prefijo data:
  return { buffer: Buffer.from(imageSource, 'base64'), mimeType: 'image/png' };
}

function mimeToExt(mimeType) {
  if (!mimeType) return 'png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  return 'png';
}

/**
 * Generate image using OpenAI's image EDITS endpoint (image-to-image).
 * This is the critical fix: /v1/images/generations only takes text and
 * cannot see the real product, so it hallucinates a new one. /v1/images/edits
 * receives the actual product photo(s) as files and edits/composes over them,
 * which is the only way to truly preserve the real product's identity.
 *
 * productImageSources: array of image URLs / data URLs / base64 strings of the REAL product.
 * referenceImageSource: optional sample ad image, used only as style reference.
 */
async function generateOpenAIImage(prompt, ratio, productImageSources = [], referenceImageSource = null) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your-')) {
    throw new Error('OpenAI API Key is missing or invalid in server config.');
  }

  if (!productImageSources || productImageSources.length === 0) {
    throw new Error('Se requiere al menos una imagen real del producto para usar el endpoint de edición. Sin imagen de producto no se puede preservar su identidad.');
  }

  // gpt-image-2 / gpt-image-1 solo aceptan estos tamaños fijos
  let size = '1024x1024';
  if (ratio === '16:9') size = '1536x1024';
  else if (ratio === '9:16') size = '1024x1536';

  const buildForm = async (model) => {
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', size);
    form.append('n', '1');
    form.append('quality', 'high');

    // IMPORTANTE: la(s) imagen(es) del producto real van PRIMERO y son las que
    // el modelo trata como el objeto a preservar. Hasta 16 imágenes soportadas.
    for (let i = 0; i < productImageSources.length; i++) {
      const { buffer, mimeType } = await fetchImageAsBuffer(productImageSources[i]);
      form.append('image[]', buffer, {
        filename: `product_${i}.${mimeToExt(mimeType)}`,
        contentType: mimeType
      });
    }

    // La imagen de referencia (si existe) se añade SOLO para que el modelo
    // tenga contexto visual de composición/estilo -- el prompt ya le indica
    // explícitamente que el producto real (las primeras imágenes) manda.
    if (referenceImageSource) {
      const { buffer, mimeType } = await fetchImageAsBuffer(referenceImageSource);
      form.append('image[]', buffer, {
        filename: `reference.${mimeToExt(mimeType)}`,
        contentType: mimeType
      });
    }

    return form;
  };

  // 1. Intentar con gpt-image-2
  try {
    console.log(`[OpenAI] Editando con gpt-image-2 (image-to-image), size: ${size}...`);
    const form = await buildForm('gpt-image-2');
    const response = await axios.post(OPENAI_EDITS_URL, form, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    const urlOrB64 = response.data?.data?.[0]?.b64_json || response.data?.data?.[0]?.url;
    if (!urlOrB64) throw new Error('No image URL or Base64 returned from gpt-image-2 edits');
    console.log(`[OpenAI gpt-image-2 edits] Generación exitosa!`);
    return { url: urlOrB64, model: 'gpt-image-2' };
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.warn(`[OpenAI] gpt-image-2 edits falló: ${errorMsg}. Probando con gpt-image-1...`);

    // 2. Fallback a gpt-image-1 (dall-e-3 fue retirado y ya no soporta edits con múltiples imágenes)
    const form = await buildForm('gpt-image-1');
    const response = await axios.post(OPENAI_EDITS_URL, form, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    const urlOrB64 = response.data?.data?.[0]?.b64_json || response.data?.data?.[0]?.url;
    if (!urlOrB64) throw new Error('No image URL or Base64 returned from gpt-image-1 fallback');
    console.log(`[OpenAI gpt-image-1 edits] Fallback exitoso!`);
    return { url: urlOrB64, model: 'gpt-image-1' };
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

    // Clean product prompt (texto descriptivo del producto dado por el usuario)
    const cleanedProduct = cleanProductPrompt(validated.producto);
    console.log(`[AI Gen] Cleaned product description for AI engines: "${cleanedProduct}"`);

    // Generate images loop
    for (let i = 0; i < validated.cantidad; i++) {
      let finalUrl = '';
      
      if (isKie) {
        try {
          // Build rich prompt based on user instructions
          let prompt = `
Create a premium commercial advertising image.

IMAGE 1:
REAL PRODUCT.
This image contains the exact product that must appear in the final output.
${validated.productImage ? `URL: ${validated.productImage}` : ''}

IMAGE 2:
REFERENCE AD.
Use only as composition and visual direction.
${validated.referenceImage ? `URL: ${validated.referenceImage}` : ''}

TASK:
Create an advertisement using IMAGE 2 as inspiration while preserving IMAGE 1 exactly.

STRICT PRODUCT LOCK:

Use IMAGE 1 as the final object.

Never:
- redraw product
- recreate product
- approximate product
- modify labels
- modify logo
- modify colors
- modify packaging
- modify dimensions
- modify geometry
- invent missing parts
- stylize product
- smooth product
- generate alternate versions

Transfer ONLY from IMAGE 2:
- composition
- framing
- camera angle
- lighting
- reflections
- atmosphere
- background
- premium advertising style

Never transfer:
- product shape
- package
- objects
- logo
- colors
- materials

If conflict exists:
IMAGE 1 wins.

OUTPUT:
Photorealistic.
Commercial photography.
Studio quality.
Theme: ${validated.estilo}
Extremely detailed.
Ultra realistic.
Product identity preservation: 100%.
Reference composition similarity: 90%.
`;

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
        // OpenAI gpt-image-2/1 generation via EDITS endpoint (image-to-image)
        try {
          if (!validated.productImage) {
            return res.status(400).json({ error: 'Se requiere una imagen del producto (productImage) para usar el motor de OpenAI. Sin ella no es posible preservar el producto real.' });
          }

          // El prompt ya NO depende de una descripción textual del producto (esa
          // descripción es la causa de que el modelo "invente" un producto distinto).
          // Ahora el modelo VE la imagen real adjunta y solo necesita instrucciones
          // de composición/estilo.
          let dallePrompt = `Edit the attached product image(s) into a premium high-end commercial advertising image for ${cleanedProduct}.

THE FIRST ATTACHED IMAGE(S) show the REAL product. This is the exact, immutable object that must appear in the final result:
- preserve its exact shape, proportions, colors, labels, logo, packaging, textures, cap/handles/accessories and every visible design detail
- do NOT redesign, reinterpret, recreate, approximate, replace, stylize, or simplify the product
- do NOT generate alternate packaging or a different version of the product
${validated.referenceImage ? `
The LAST attached image is a sample advertisement, included ONLY as a style/composition reference. Copy from it ONLY: composition, camera framing, lighting, shadows, reflections, color atmosphere, background style and premium advertising feel. Do NOT copy any object, product, packaging, label, logo or color from this reference image.` : ''}

TASK: Place the real product (first image) into a new commercial advertising scene${validated.referenceImage ? ', following the visual style of the reference image' : ''}.

FINAL OUTPUT:
Professional advertising banner. Theme: ${validated.estilo}. Photorealistic, commercial studio quality, luxury presentation, ultra detailed, 8k quality, masterfully lit, extremely sharp focus. Product identity must match the attached real product at 98-100%.`;

          const productImages = Array.isArray(validated.productImage)
            ? validated.productImage
            : [validated.productImage];

          const { url, model } = await generateOpenAIImage(
            dallePrompt,
            validated.formato,
            productImages,
            validated.referenceImage || null
          );
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
