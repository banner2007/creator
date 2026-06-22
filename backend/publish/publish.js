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
      // Support full-bleed image if there is coverImage and no title/subtitle
      if (content.coverImage && !content.title && !content.subtitle) {
        return `
          <section class="relative bg-white overflow-hidden">
            <img src="${content.coverImage}" alt="Hero Banner" class="w-full h-auto block" loading="eager" fetchpriority="high">
          </section>
        `;
      }
      
      const bgStyle = content.coverImage 
        ? `background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.95)), url(${content.coverImage}); background-size: cover; background-position: center;` 
        : 'background-color: #ffffff;';
      
      return `
        <section class="relative flex items-center justify-center overflow-hidden py-16 px-6 text-slate-900 border-b border-slate-100" style="${bgStyle}">
          <div class="max-w-xl mx-auto text-center relative z-10">
            ${content.badge ? `
              <span class="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full inline-block mb-4">
                ${content.badge}
              </span>
            ` : ''}
            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              ${content.title || 'Título del Producto'}
            </h1>
            ${content.subtitle ? `
              <p class="mt-4 text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
                ${content.subtitle}
              </p>
            ` : ''}
            ${content.ctaText ? `
              <div class="mt-6 flex justify-center">
                <a href="${content.ctaLink || '#offer'}" class="px-8 py-3.5 text-sm font-extrabold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 transform hover:-translate-y-0.5 anim-shake">
                  ${content.ctaText}
                </a>
              </div>
            ` : ''}
          </div>
        </section>
      `;
      
    case 'benefits':
      const items = content.items || [];
      return `
        <section class="py-12 px-6 bg-slate-50 text-slate-900 border-b border-slate-100">
          <div class="max-w-xl mx-auto">
            <h2 class="text-xl sm:text-2xl font-black text-center text-slate-900 mb-8">
              ${content.title || 'Beneficios Exclusivos'}
            </h2>
            
            <div class="grid grid-cols-1 gap-4">
              ${items.map(item => `
                <div class="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-4">
                  <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-slate-900 mb-1">${item.title || 'Beneficio'}</h3>
                    <p class="text-xs text-slate-500 leading-relaxed">${item.description || 'Detalle del beneficio.'}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;
      
    case 'offer':
      const features = content.features || [];
      return `
        <section id="offer" class="py-12 px-6 bg-white text-slate-800">
          <div class="max-w-xl mx-auto">
            <div class="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-100 shadow-xl relative overflow-hidden text-center">
              ${content.badge ? `
                <div class="bg-emerald-500 text-white text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider animate-pulse inline-block mb-4">
                  ${content.badge}
                </div>
              ` : ''}
              
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 mb-2">${content.title || '¡Oferta Especial!'}</h2>
              
              <div class="mt-4 flex flex-col items-center gap-4 border-b border-slate-200/60 pb-6">
                <div>
                  <span class="text-slate-400 line-through text-xs">Antes $${content.originalPrice || '149.900'}</span>
                  <div class="flex items-baseline justify-center mt-1">
                    <span class="text-4xl font-black text-emerald-600">$${content.price || '89.900'}</span>
                    <span class="text-slate-500 text-xs ml-2 font-bold">COP / Envío Gratis</span>
                  </div>
                </div>
                
                <button onclick="handlePurchase()" class="w-full px-8 py-3.5 text-sm font-black rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-0.5 anim-shake">
                  ${content.buttonText || 'PEDIR CON DESCUENTO'}
                </button>
              </div>
              
              <div class="mt-6 text-left">
                <h4 class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">¿Qué incluye tu pedido?</h4>
                <ul class="grid grid-cols-1 gap-2.5">
                  ${features.map(f => `
                    <li class="flex items-center text-slate-700 text-xs">
                      <div class="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-2 shrink-0">
                        <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <span class="font-medium">${f}</span>
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
        <section class="py-12 px-6 bg-slate-50 text-slate-900 border-b border-slate-100">
          <div class="max-w-xl mx-auto">
            <h2 class="text-xl font-black text-center mb-8 text-slate-900">${content.title || 'Preguntas Frecuentes'}</h2>
            <div class="space-y-4">
              ${questions.map((q, idx) => `
                <div class="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <h4 class="text-xs font-bold text-slate-900 flex items-start">
                    <span class="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md mr-3 mt-0.5 font-extrabold shrink-0">Q</span>
                    ${q.q}
                  </h4>
                  <p class="mt-2 text-xs text-slate-500 pl-8 leading-relaxed">${q.a}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;
      
    case 'gallery':
      const images = content.images || [];
      return `
        <section class="py-6 bg-white border-b border-slate-100">
          <div class="max-w-xl mx-auto">
            <div class="grid grid-cols-1 gap-0">
              ${images.filter(img => img).map(img => `
                <div class="bg-white overflow-hidden">
                  <img src="${img}" alt="Gallería" class="w-full h-auto block" loading="lazy">
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;
      
    case 'reviews':
      const reviews = content.reviews || [];
      return `
        <section class="py-12 px-6 bg-slate-50 text-slate-900 border-b border-slate-100">
          <div class="max-w-xl mx-auto">
            <h2 class="text-xl font-black text-center mb-8 text-slate-900">${content.title || 'Lo Que Opinan Nuestros Clientes'}</h2>
            <div class="grid grid-cols-1 gap-4">
              ${reviews.map(r => `
                <div class="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative flex flex-col justify-between">
                  <div class="mb-4">
                    <div class="flex text-amber-400 gap-0.5 mb-2">
                      ${Array(r.rating || 5).fill('').map(() => `
                        <svg class="w-4.5 h-4.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                      `).join('')}
                    </div>
                    <p class="text-slate-700 text-xs italic">"${r.comment || 'Excelente producto'}"</p>
                  </div>
                  <div class="flex items-center gap-2 border-t border-slate-100 pt-3 mt-1">
                    <div class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] uppercase">
                      ${r.name ? r.name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <h5 class="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                        <span>${r.name || 'Cliente Satisfecho'}</span>
                        <span class="inline-flex items-center text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">Verificado</span>
                      </h5>
                      <span class="text-slate-400 text-[10px]">${r.title || 'Comprador verificado'}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;

    case 'cta':
      return `
        <section class="py-12 px-6 bg-white text-center border-b border-slate-100">
          <div class="max-w-xl mx-auto space-y-6">
            ${content.coverImage ? `
              <div class="relative rounded-2xl overflow-hidden shadow-md">
                <img src="${content.coverImage}" alt="CTA Banner" class="w-full h-auto block" loading="lazy">
              </div>
            ` : ''}
            ${content.title ? `<h3 class="text-xl font-bold text-slate-900 leading-tight">${content.title}</h3>` : ''}
            ${content.subtitle ? `<p class="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">${content.subtitle}</p>` : ''}
            <div class="flex justify-center">
              <a href="${content.buttonLink || '#offer'}" class="px-8 py-3.5 text-xs font-black rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 transform hover:-translate-y-0.5 anim-shake inline-block">
                ${content.buttonText || 'COMPRAR AHORA'}
              </a>
            </div>
          </div>
        </section>
      `;

    case 'comparison':
      return `
        <div 
          class="py-3 px-6 text-center font-extrabold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center min-h-[40px] border-b border-black/10 select-none shadow-[inset_0_-2px_6px_rgba(0,0,0,0.05)]"
          style="background-color: ${content.bgColor || '#9333ea'}; color: ${content.textColor || '#ffffff'};"
        >
          <span>${content.text || 'Texto de la franja'}</span>
        </div>
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

  let html = `
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
      background-color: #eef0f3;
    }

    /* Mobile-first frame on desktop */
    @media (min-width: 481px) {
      .ms-mobile-preview {
        max-width: 480px;
        margin: 0 auto;
        background-color: #ffffff;
        box-shadow: 0 10px 50px rgba(15, 23, 42, 0.08);
        min-height: 100vh;
      }
    }

    @media (max-width: 480px) {
      body {
        background-color: #ffffff;
      }
      .ms-mobile-preview {
        width: 100%;
        min-height: 100vh;
      }
    }

    /* Shake Animation for converting CTAs */
    @keyframes cta-shake {
      0%, 100% { transform: scale(1) translateX(0); }
      10%, 30% { transform: scale(1.02) translateX(-4px); }
      20%, 40% { transform: scale(1.02) translateX(4px); }
      50% { transform: scale(1) translateX(0); }
    }

    .anim-shake {
      animation: cta-shake 3s ease-in-out infinite;
    }

    /* Floating footer CTA styling */
    .cta-floating-container {
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      padding: 14px 16px !important;
      background-color: rgba(255, 255, 255, 0.9) !important;
      backdrop-filter: blur(8px) !important;
      border-top: 1px solid rgba(15, 23, 42, 0.06) !important;
      z-index: 99999 !important;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
    }

    @media (min-width: 481px) {
      .cta-floating-container {
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 100% !important;
        max-width: 480px !important;
      }
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
  
  <!-- Custom CSS -->
  ${landing.custom_css ? `<style>${landing.custom_css}</style>` : ''}
  
  <!-- Page Copy Masking -->
  ${landing.masking ? `
  <style>
    body {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  </style>
  <script>
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 'i' || e.key === 's')) {
        e.preventDefault();
      }
    });
  </script>
  ` : ''}
</head>
<body class="text-slate-800 antialiased">

  <div class="ms-mobile-preview relative pb-24">
    <main>
      ${renderedSections}
    </main>

    <!-- Floating CTA Bar -->
    ${(landing.floating_cta_active === undefined || landing.floating_cta_active) ? `
    <div class="cta-floating-container flex items-center justify-center">
      <a href="#offer" class="w-full text-center py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm tracking-wide shadow-md transition-all duration-300 transform active:scale-95 anim-shake">
        ${landing.floating_cta_text || '¡PEDIR CON DESCUENTO!'}
      </a>
    </div>
    ` : ''}

    <!-- Floating WhatsApp Button -->
    ${(landing.whatsapp_active === undefined || landing.whatsapp_active) ? `
    <a href="https://wa.me/${landing.whatsapp_phone || '573242035307'}?text=${encodeURIComponent(landing.whatsapp_text || 'Hola, quiero información sobre este producto.')}" target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp" class="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-xl transition-transform hover:scale-110 hover:bg-green-600 active:scale-95">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="h-7 w-7 fill-white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.742 3.052 9.376L1.054 31.28l6.156-1.968C9.758 30.98 12.762 32 16.004 32 24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.35 22.606c-.392 1.106-1.94 2.024-3.186 2.292-.854.182-1.968.326-5.72-1.23-4.802-1.99-7.892-6.86-8.132-7.178-.23-.318-1.938-2.58-1.938-4.922 0-2.342 1.228-3.494 1.664-3.972.392-.43 1.034-.612 1.648-.612.198 0 .376.01.536.018.478.02.716.048 1.032.796.392.934 1.348 3.276 1.466 3.514.12.238.24.556.08.874-.148.326-.278.47-.516.742-.238.272-.464.48-.702.772-.216.256-.46.53-.196.99.264.452 1.174 1.934 2.52 3.134 1.734 1.544 3.194 2.024 3.648 2.248.354.178.776.138 1.052-.158.348-.376.778-.998 1.216-1.612.31-.438.702-.494 1.094-.334.398.152 2.526 1.19 2.958 1.408.432.218.72.326.826.508.104.182.104 1.062-.288 2.168z"></path>
      </svg>
    </a>
    ` : ''}

    <footer class="py-12 bg-white border-t border-slate-100 text-center text-slate-400 text-xs">
      <p>&copy; ${new Date().getFullYear()} ${landing.title}. Todos los derechos reservados.</p>
      <p class="mt-2">Página construida con <a href="https://shopy.uno" class="text-emerald-500 hover:underline font-extrabold">shopy.uno</a></p>
    </footer>
  </div>

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

  if (landing.lazy_load === false) {
    html = html.replace(/loading="lazy"/g, 'loading="eager"');
  }
  return html;
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
