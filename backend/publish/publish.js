import { Router } from 'express';
import { supabase } from '../server.js';
import { requireAuth } from '../middleware/auth.js';
import axios from 'axios';

const router = Router();

// Retrieve Make.com webhook URL from env
const MAKE_PUBLISH_WEBHOOK_URL = process.env.MAKE_PUBLISH_WEBHOOK_URL;

// Simple Regex HTML Minifier
function minifyHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .replace(/\s+/g, ' ')            // Collapse multiple spaces
    .replace(/>\s+</g, '><')          // Remove space between tags
    .trim();
}

// Render individual sections to static HTML
function renderSection(section) {
  const content = section.content_json || {};
  
  switch (section.type) {
    case 'hero':
      return `
        <section class="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-20 px-6 bg-slate-950 text-white">
          <!-- Glassmorphism backdrop -->
          <div class="absolute inset-0 z-0">
            <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
            <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
          </div>
          
          <div class="max-w-4xl mx-auto text-center z-10 relative">
            <span class="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-purple-300">
              Lanzamiento Oficial
            </span>
            <h1 class="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-purple-400 bg-clip-text text-transparent leading-tight">
              ${content.title || 'Título del Producto'}
            </h1>
            <p class="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              ${content.subtitle || 'Subtítulo o descripción atractiva del producto.'}
            </p>
            <div class="mt-10 flex flex-wrap justify-center gap-4">
              <a href="${content.ctaLink || '#offer'}" class="px-8 py-4 text-base font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all duration-300 transform hover:-translate-y-0.5">
                ${content.ctaText || 'Comprar Ahora'}
              </a>
            </div>
          </div>
        </section>
      `;
      
    case 'benefits':
      const items = content.items || [];
      return `
        <section class="py-24 px-6 bg-slate-900 text-white relative">
          <div class="max-w-6xl mx-auto z-10 relative">
            <div class="text-center max-w-2xl mx-auto mb-16">
              <h2 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                ${content.title || 'Beneficios Exclusivos'}
              </h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              ${items.map(item => `
                <div class="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg hover:border-purple-500/50 hover:bg-white/[0.07] transition-all duration-300 group">
                  <div class="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  <h3 class="text-xl font-bold mb-3 text-slate-100">${item.title || 'Beneficio'}</h3>
                  <p class="text-slate-400 leading-relaxed">${item.description || 'Detalle del beneficio.'}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;
      
    case 'offer':
      const features = content.features || [];
      return `
        <section id="offer" class="py-24 px-6 bg-slate-950 text-white relative">
          <div class="max-w-4xl mx-auto z-10 relative">
            <div class="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/20 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
              <!-- Banner decorativo -->
              ${content.badge ? `
                <div class="absolute top-6 right-6 bg-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider animate-bounce">
                  ${content.badge}
                </div>
              ` : ''}
              
              <h2 class="text-3xl sm:text-4xl font-bold mb-4">${content.title || '¡Oferta Limitada!'}</h2>
              
              <div class="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-b border-white/10 pb-8">
                <div>
                  <span class="text-slate-400 line-through text-lg">Antes $${content.originalPrice || '99.99'}</span>
                  <div class="flex items-baseline mt-2">
                    <span class="text-5xl font-extrabold text-white">$${content.price || '49.99'}</span>
                    <span class="text-slate-400 ml-2">USD</span>
                  </div>
                </div>
                
                <button onclick="handlePurchase()" class="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 shadow-[0_0_25px_rgba(147,51,234,0.5)] transition-all duration-300 transform hover:-translate-y-0.5">
                  ${content.buttonText || 'Adquirir Ahora'}
                </button>
              </div>
              
              <div class="mt-8">
                <h4 class="text-sm font-semibold uppercase tracking-wider text-purple-400 mb-4">¿Qué incluye tu compra?</h4>
                <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  ${features.map(f => `
                    <li class="flex items-center text-slate-300 text-sm">
                      <svg class="w-5 h-5 text-purple-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                      ${f}
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          </div>
        </section>
      `;
      
    case 'faq':
      const questions = content.questions || [];
      return `
        <section class="py-24 px-6 bg-slate-900 text-white">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-center mb-12">${content.title || 'Preguntas Frecuentes'}</h2>
            <div class="space-y-6">
              ${questions.map((q, idx) => `
                <div class="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <h4 class="text-lg font-semibold text-purple-300 flex items-start">
                    <span class="bg-purple-600/20 text-purple-400 text-xs px-2.5 py-1 rounded-md mr-3 mt-0.5">Q</span>
                    ${q.q}
                  </h4>
                  <p class="mt-3 text-slate-400 pl-10 leading-relaxed">${q.a}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;
      
    case 'gallery':
      const images = content.images || [];
      return `
        <section class="py-24 px-6 bg-slate-950 text-white">
          <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl font-bold text-center mb-12">${content.title || 'Galería de Producto'}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              ${images.map(img => `
                <div class="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900 aspect-square">
                  <img src="${img}" alt="Preview" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p class="text-sm font-semibold text-white">Imagen Comercial</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;
      
    case 'reviews':
      const reviews = content.reviews || [];
      return `
        <section class="py-24 px-6 bg-slate-900 text-white">
          <div class="max-w-6xl mx-auto">
            <h2 class="text-3xl font-bold text-center mb-12">${content.title || 'Lo Que Opinan Nuestros Clientes'}</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              ${reviews.map(r => `
                <div class="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative flex flex-col justify-between">
                  <div class="mb-6">
                    <div class="flex text-amber-400 mb-4">
                      ${Array(r.rating || 5).fill('').map(() => `
                        <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                      `).join('')}
                    </div>
                    <p class="text-slate-300 italic">"${r.comment || 'Excelente producto'}"</p>
                  </div>
                  <div>
                    <h5 class="text-slate-100 font-bold">${r.name || 'Cliente Satisfecho'}</h5>
                    <span class="text-slate-500 text-xs">${r.title || 'Comprador verificado'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    default:
      return '';
  }
}

// Compile complete HTML Page
function compileLandingHtml(landing, sections) {
  const renderedSections = sections
    .sort((a, b) => a.position - b.position)
    .map(renderSection)
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${landing.seo_title || landing.title}</title>
  <meta name="description" content="${landing.seo_description || ''}">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          },
        }
      }
    }
  </script>
  
  <style>
    body {
      font-family: 'Inter', sans-serif;
      scroll-behavior: smooth;
    }
  </style>

  <!-- Open Graph -->
  <meta property="og:title" content="${landing.seo_title || landing.title}">
  <meta property="og:description" content="${landing.seo_description || ''}">
  <meta property="og:type" content="website">

  <!-- Schema.org Product Structured Data -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "${landing.title}",
      "description": "${landing.seo_description || ''}"
    }
  </script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">

  <main>
    ${renderedSections}
  </main>

  <footer class="py-12 bg-slate-950 border-t border-white/5 text-center text-slate-500 text-sm">
    <p>&copy; ${new Date().getFullYear()} ${landing.title}. Todos los derechos reservados.</p>
    <p class="mt-2 text-xs">Página construida con <a href="https://shopy.uno" class="text-purple-400 hover:underline">shopy.uno</a></p>
  </footer>

  <script>
    // Purchase Trigger
    function handlePurchase() {
      // Track conversion in backend
      fetch('/api/analytics/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingId: '${landing.id}', type: 'purchase_click' })
      }).catch(err => console.error(err));
      
      alert('¡Redirigiendo a la pasarela de pago!');
    }

    // Auto-track visit on page load
    window.addEventListener('DOMContentLoaded', () => {
      fetch('/api/analytics/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landingId: '${landing.id}' })
      }).catch(err => console.error(err));
    });
  </script>
</body>
</html>
  `;
}

/**
 * @route   POST /api/publish
 * @desc    Compile, minify and publish landing page to Supabase Storage exports bucket
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { landingId } = req.body;
    if (!landingId) return res.status(400).json({ error: 'landingId is required.' });

    // 1. Fetch landing details
    const { data: landing, error: lError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', landingId)
      .single();

    if (lError || !landing) {
      return res.status(404).json({ error: 'Landing page not found.' });
    }

    // Verify project belongs to user
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', landing.project_id)
      .eq('user_id', req.user.id)
      .single();

    if (!project) {
      return res.status(403).json({ error: 'Access denied: Project does not belong to user.' });
    }

    // 2. Fetch all sections
    const { data: sections, error: sError } = await supabase
      .from('sections')
      .select('*')
      .eq('landing_id', landingId)
      .order('position', { ascending: true });

    if (sError || !sections) {
      return res.status(400).json({ error: 'Failed to retrieve landing page sections.' });
    }

    // 3. Compile and minify HTML
    const rawHtml = compileLandingHtml(landing, sections);
    const minifiedHtml = minifyHtml(rawHtml);
    const buffer = Buffer.from(minifiedHtml, 'utf-8');

    // 4. Upload to Supabase Storage exports bucket
    const filePath = `pages/${landing.slug}/index.html`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('exports')
      .upload(filePath, buffer, {
        contentType: 'text/html',
        cacheControl: '0', // No cache for editor publish runs
        upsert: true
      });

    if (uploadError) {
      console.error('[Publish] Upload failed:', uploadError);
      return res.status(500).json({ error: 'Failed to upload static file to CDN Storage.' });
    }

    // 5. Update landing page status in DB
    await supabase
      .from('landing_pages')
      .update({ published: true })
      .eq('id', landingId);

    // Create or update publication record
    const targetDomain = `${landing.slug}.shopy.uno`;
    const { data: pubRecord, error: pubError } = await supabase
      .from('publications')
      .upsert({
        landing_id: landingId,
        domain: targetDomain,
        status: 'active',
        published_at: new Date().toISOString()
      }, {
        onConflict: 'landing_id'
      })
      .select()
      .single();

    if (pubError) console.error('[Publish] Failed to insert publication record:', pubError);

    // 6. Trigger Make.com webhook automation
    if (MAKE_PUBLISH_WEBHOOK_URL) {
      try {
        console.log(`[Publish] Triggering Make.com automation: ${MAKE_PUBLISH_WEBHOOK_URL}`);
        await axios.post(MAKE_PUBLISH_WEBHOOK_URL, {
          landingId,
          slug: landing.slug,
          title: landing.title,
          domain: targetDomain,
          publishedAt: pubRecord?.published_at || new Date().toISOString(),
          sectionsCount: sections.length
        });
      } catch (webhookErr) {
        console.error('[Publish] Make.com Webhook trigger failed:', webhookErr.message);
      }
    }

    // 7. Audit log
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'publish_landing',
      metadata: {
        landing_id: landingId,
        slug: landing.slug,
        domain: targetDomain
      }
    });

    return res.json({
      success: true,
      domain: targetDomain,
      url: `/published/${landing.slug}`,
      published_at: pubRecord?.published_at || new Date().toISOString()
    });
  } catch (err) {
    console.error('Publishing error:', err);
    return res.status(500).json({ error: 'Internal server error during publishing.' });
  }
});

export default router;
