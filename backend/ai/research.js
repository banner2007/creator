import { Router } from 'express';
import { supabase } from '../server.js';
import { requireAuth } from '../middleware/auth.js';
import axios from 'axios';
import { z } from 'zod';

const router = Router();

// Retrieve OpenAI API key (check process.env.API since it is configured as API=sk-proj-... in .env)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.API;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// Zod validation
const researchSchema = z.object({
  productId: z.string().uuid()
});

/**
 * Helper to call OpenAI API
 */
async function callOpenAI(prompt) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('your-')) {
    throw new Error('OpenAI API Key is missing or invalid in server configuration.');
  }

  const response = await axios.post(OPENAI_URL, {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto consultor de marketing digital, ecommerce de alta conversión y dropshipping en América Latina. Tus análisis son profesionales, persuasivos, estructurados en formato Markdown y listos para implementarse en campañas reales.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7
  }, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content;
}

/**
 * Helper to verify user credits and deduct 1 credit
 */
async function deductCredit(userId) {
  const { data: profile, error } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('User profile not found.');
  }

  if (profile.credits < 1) {
    throw new Error('Insufficient credits. Each AI research action costs 1 credit.');
  }

  const newCredits = profile.credits - 1;
  const { error: updateError } = await supabase
    .from('users')
    .update({ credits: newCredits })
    .eq('id', userId);

  if (updateError) throw updateError;

  return newCredits;
}

/**
 * @route   POST /api/ai/research/product
 * @desc    Get an advanced commercial viability analysis of a product
 */
router.post('/product', requireAuth, async (req, res) => {
  try {
    const validated = researchSchema.parse(req.body);
    const userId = req.user.id;

    // Fetch product details
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .eq('id', validated.productId)
      .eq('user_id', userId)
      .single();

    if (pError || !product) {
      return res.status(404).json({ error: 'Product not found or access denied.' });
    }

    // Deduct credit
    const remainingCredits = await deductCredit(userId);

    // Prompt OpenAI
    const prompt = `Haz un análisis comercial completo para el siguiente producto:
Nombre del producto: ${product.name}
Descripción: ${product.description || 'Sin descripción provista.'}
Categoría: ${product.category || 'General'}
Precio estimado: $${product.price}

Por favor genera un reporte estructurado en Markdown con las siguientes secciones en español:
1. 📈 **Análisis de Viabilidad Comercial**: Oportunidad de mercado, puntuación de viabilidad del 1 al 10 y justificación.
2. 👍 **Puntos Fuertes (Pros)**: Ventajas competitivas, atractivo visual y potencial en plataformas de e-commerce.
3. 👎 **Puntos Débiles (Desafíos)**: Retos logísticos, devoluciones comunes, barreras de compra y cómo superarlas.
4. 🚀 **Recomendaciones de Escalado**: Estrategias de oferta (Bundles), precios y canales publicitarios ideales (Meta Ads vs TikTok Ads).`;

    const report = await callOpenAI(prompt);

    // Save to audit logs
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'ai_research_product',
      metadata: { productId: product.id, productName: product.name }
    });

    return res.json({
      success: true,
      report,
      creditsLeft: remainingCredits
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('AI Product Research error:', err);
    return res.status(500).json({ error: err.message || 'Error executing AI product research.' });
  }
});

/**
 * @route   POST /api/ai/research/angles
 * @desc    Generate 3 high-converting sales angles for the product
 */
router.post('/angles', requireAuth, async (req, res) => {
  try {
    const validated = researchSchema.parse(req.body);
    const userId = req.user.id;

    // Fetch product details
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .eq('id', validated.productId)
      .eq('user_id', userId)
      .single();

    if (pError || !product) {
      return res.status(404).json({ error: 'Product not found or access denied.' });
    }

    // Deduct credit
    const remainingCredits = await deductCredit(userId);

    // Prompt OpenAI
    const prompt = `Genera 3 ángulos de venta de alta conversión para el siguiente producto:
Nombre del producto: ${product.name}
Descripción: ${product.description || 'Sin descripción provista.'}
Precio estimado: $${product.price}

Por favor genera un reporte estructurado en Markdown que detalle cada uno de los 3 ángulos con el siguiente esquema en español:
### 1. 🎯 Ángulo 1: Enfoque Racional y Beneficio Directo
*   **Enfoque**: De qué se trata este ángulo (ej. Ahorro de tiempo, comodidad, calidad premium).
*   **Titular Persuasivo (Hook)**: Un titular llamativo para la landing page.
*   **Texto del Anuncio**: Un copy persuasivo de 2-3 líneas para Facebook/Instagram Ads.
*   **Llamado a la Acción (CTA)**: Qué texto usar en el botón.

### 2. 💖 Ángulo 2: Enfoque Emocional o Status
*   **Enfoque**: Cómo transforma la vida del usuario o el estatus que otorga (ej. Seguridad, pertenencia, autoestima).
*   **Titular Persuasivo (Hook)**: Un titular cargado de emoción.
*   **Texto del Anuncio**: Copy corto persuasivo enfocado en la transformación del cliente.
*   **Llamado a la Acción (CTA)**: Qué texto usar en el botón.

### 3. ⚠️ Ángulo 3: Enfoque de Dolor o Urgencia
*   **Enfoque**: Ataca el dolor principal que resuelve el producto o introduce urgencia/escasez.
*   **Titular Persuasivo (Hook)**: Titular disruptivo enfocado en el problema.
*   **Texto del Anuncio**: Copy que agita el dolor del cliente e introduce el producto como la única solución.
*   **Llamado a la Acción (CTA)**: Qué texto usar en el botón.`;

    const report = await callOpenAI(prompt);

    // Save to audit logs
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'ai_research_angles',
      metadata: { productId: product.id, productName: product.name }
    });

    return res.json({
      success: true,
      report,
      creditsLeft: remainingCredits
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('AI Sales Angles error:', err);
    return res.status(500).json({ error: err.message || 'Error executing AI sales angles generation.' });
  }
});

/**
 * @route   POST /api/ai/research/avatar
 * @desc    Generate customer profile (buyer persona) details for the product
 */
router.post('/avatar', requireAuth, async (req, res) => {
  try {
    const validated = researchSchema.parse(req.body);
    const userId = req.user.id;

    // Fetch product details
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .eq('id', validated.productId)
      .eq('user_id', userId)
      .single();

    if (pError || !product) {
      return res.status(404).json({ error: 'Product not found or access denied.' });
    }

    // Deduct credit
    const remainingCredits = await deductCredit(userId);

    // Prompt OpenAI
    const prompt = `Define detalladamente el perfil del Avatar (Cliente Ideal / Buyer Persona) para el siguiente producto:
Nombre del producto: ${product.name}
Descripción: ${product.description || 'Sin descripción provista.'}
Precio estimado: $${product.price}

Por favor genera un perfil estructurado en Markdown que incluya los siguientes apartados en español:
1. 👤 **Perfil Demográfico**: Edad estimada, género ideal, nivel de ingresos relativo, intereses clave en redes sociales.
2. 🧠 **Dolores y Frustraciones**: ¿Cuáles son sus 3 principales dolores o frustraciones diarias que este producto le ayuda a aliviar?
3. 🌟 **Deseos y Aspiraciones**: ¿Qué desea lograr este cliente? ¿Cómo se sentirá emocionalmente después de adquirir y usar el producto?
4. 🛡️ **Objeciones Comunes & Respuestas**: Identifica las 3 objeciones principales de compra (ej: "Es muy caro", "No sé si funcionará") y provee las respuestas ideales en el copy de la landing para desactivarlas.`;

    const report = await callOpenAI(prompt);

    // Save to audit logs
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'ai_research_avatar',
      metadata: { productId: product.id, productName: product.name }
    });

    return res.json({
      success: true,
      report,
      creditsLeft: remainingCredits
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('AI Avatar Research error:', err);
    return res.status(500).json({ error: err.message || 'Error executing AI avatar profiling.' });
  }
});

/**
 * @route   POST /api/ai/research/generate-angles
 * @desc    Generate exactly 5 high-converting sales angles for the product from description or product link
 */
router.post('/generate-angles', requireAuth, async (req, res) => {
  try {
    const { productId, description, productLink } = req.body;
    const userId = req.user.id;

    // Deduct credit
    const remainingCredits = await deductCredit(userId);

    let productInfoText = "";
    if (productId && productId !== 'new') {
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', userId)
        .single();
      if (product) {
        productInfoText += `Nombre del producto: ${product.name}\nDescripción del producto: ${product.description || ''}\nPrecio del producto: $${product.price}\n`;
      }
    }

    if (description) {
      productInfoText += `Descripción adicional/general: ${description}\n`;
    }

    if (productLink) {
      productInfoText += `Enlace del producto: ${productLink}\n`;
      try {
        const urlResponse = await axios.get(productLink, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = urlResponse.data;
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : '';
        const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
        const metaDesc = metaMatch ? metaMatch[1] : '';
        productInfoText += `(Información extraída del enlace - Título: ${title}. Descripción Meta: ${metaDesc})\n`;
      } catch (urlErr) {
        console.error('Error fetching product link:', urlErr.message);
      }
    }

    const prompt = `Genera exactamente 5 ángulos de venta de alta conversión para el siguiente producto en formato JSON:
${productInfoText}

Por favor, devuelve un objeto JSON con la clave "angles" que contenga un arreglo de exactamente 5 objetos. Cada objeto del arreglo debe tener los siguientes campos en español:
1. "titulo": El titular persuasivo (Hook) corto del ángulo.
2. "enfoque": El enfoque o beneficio principal (ej. Ahorro de tiempo, comodidad, calidad premium).
3. "texto": El copy persuasivo o texto corto de 2-3 líneas para Facebook/Instagram/Landing.
4. "cta": El texto sugerido para el botón de llamado a la acción.

Responde únicamente con el objeto JSON válido. No incluyas explicaciones ni bloques de código markdown.`;

    const rawResponse = await callOpenAI(prompt);
    
    let jsonResponse;
    try {
      const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      jsonResponse = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Error parsing JSON from OpenAI:', rawResponse);
      throw new Error('La respuesta de la IA no pudo ser analizada como un JSON válido.');
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'ai_research_generate_angles',
      metadata: { productId, productLink }
    });

    return res.json({
      success: true,
      angles: jsonResponse.angles || [],
      creditsLeft: remainingCredits
    });
  } catch (err) {
    console.error('Generate sales angles error:', err);
    return res.status(500).json({ error: err.message || 'Error executing sales angles generation.' });
  }
});

export default router;
