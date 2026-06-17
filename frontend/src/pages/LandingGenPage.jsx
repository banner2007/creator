import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { Sparkles, Sliders, Image, Download, Wand2, RefreshCw, FileImage, Palette, HelpCircle, Check } from 'lucide-react';

const LANDING_SECTIONS = [
  { id: 'conversion-hero', name: 'Cabecera Hero Principal', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80', description: 'Sección superior de landing con título llamativo, subtítulo y espacio para producto.' },
  { id: 'features-grid', name: 'Características y Beneficios', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80', description: 'Grilla de beneficios del producto para derribar objeciones.' },
  { id: 'reviews-panel', name: 'Panel de Testimonios', url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80', description: 'Caja premium de reviews con estrellas y comentarios persuasivos.' },
  { id: 'pricing-block', name: 'Bloque de Oferta e Incentivo', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80', description: 'Sección de oferta con precio descontado, garantía y botón de compra.' }
];

export default function LandingGenPage() {
  const {
    products,
    projects,
    selectedProject,
    fetchProducts,
    fetchProjects,
    selectProject,
    isGeneratingImages,
    generateImages,
    generatedImages,
    fetchProjectImages
  } = useStore();

  // Form State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSection, setSelectedSection] = useState(LANDING_SECTIONS[0].id);
  const [format, setFormat] = useState('16:9');
  const [language, setLanguage] = useState('es');
  const [engine, setEngine] = useState('kie-ai'); // kie-ai or openai
  const [bgColor, setBgColor] = useState('#0f172a'); // default slate-900 background
  const [customStyle, setCustomStyle] = useState('');
  const [customImage, setCustomImage] = useState('');

  // Results State
  const [successImages, setSuccessImages] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectImages(selectedProject.id);
    }
  }, [selectedProject]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      alert('Por favor selecciona un Proyecto para asociar los bloques de la landing.');
      return;
    }
    if (!selectedProduct) {
      alert('Por favor selecciona un producto.');
      return;
    }

    const prod = products.find(p => p.id === selectedProduct);
    const sectionObj = LANDING_SECTIONS.find(t => t.id === selectedSection);

    // Build rich prompt for landing section layout
    let promptText = `Landing page section type: ${sectionObj?.name}. Product: ${prod.name}. Background color: ${bgColor}. Description: ${prod.description}.`;
    if (customStyle.trim()) {
      promptText += ` Style customization: ${customStyle}`;
    }

    const refImage = customImage.trim() || sectionObj?.url || '';

    const results = await generateImages(
      promptText,
      sectionObj?.id || 'hero',
      format,
      1,
      selectedProject.id,
      engine,
      refImage
    );

    if (results && results.length > 0) {
      setSuccessImages(results);
      fetchProjectImages(selectedProject.id);
    }
  };

  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <Sparkles class="w-8 h-8 text-purple-400 animate-pulse" />
          <span>Generador de Secciones de Landing IA</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Crea secciones completas de landing pages listas para vender (Hero, ofertas, testimonios) estructuradas como imágenes de alta definición.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Controls - 8 Cols */}
        <form onSubmit={handleGenerate} class="lg:col-span-8 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <div class="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 class="font-bold text-lg text-slate-200 flex items-center gap-2">
              <Sliders class="w-5 h-5 text-purple-400" />
              Configurar Sección de Landing
            </h3>
            
            {/* Project Selector */}
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500 font-semibold">Campaña/Proyecto:</span>
              <select
                class="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-semibold focus:outline-none"
                value={selectedProject?.id || ''}
                onChange={e => {
                  const proj = projects.find(p => p.id === e.target.value);
                  if (proj) selectProject(proj);
                }}
              >
                <option value="" disabled>Selecciona Proyecto...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Selection */}
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-400">1. Selecciona el Producto</label>
            {products.length === 0 ? (
              <p class="text-xs text-yellow-400">Aún no tienes productos agregados. Registra uno en "Mis Productos" primero.</p>
            ) : (
              <select
                class="glass-input bg-slate-950 font-medium"
                value={selectedProduct}
                onChange={e => setSelectedProduct(e.target.value)}
                required
              >
                <option value="">-- Selecciona un producto registrado --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                ))}
              </select>
            )}
          </div>

          {/* Section Type Selection */}
          <div class="space-y-3">
            <label class="text-xs font-semibold text-slate-400 block">2. Selecciona la Estructura / Tipo de Sección</label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              {LANDING_SECTIONS.map(sec => (
                <div 
                  key={sec.id}
                  onClick={() => {
                    setSelectedSection(sec.id);
                    setCustomImage('');
                  }}
                  class={`glass-panel border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 relative ${
                    selectedSection === sec.id && !customImage
                      ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500'
                      : 'border-white/5 bg-white/[0.01] hover:border-white/20'
                  }`}
                >
                  <div class="aspect-square relative overflow-hidden bg-slate-950">
                    <img src={sec.url} alt={sec.name} class="w-full h-full object-cover" />
                    {selectedSection === sec.id && !customImage && (
                      <div class="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                        <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white border border-purple-400 shadow-md">
                          <Check class="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div class="p-3">
                    <h5 class="text-xs font-bold text-slate-200 line-clamp-1">{sec.name}</h5>
                    <p class="text-[9px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{sec.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Section Template URL */}
            <div class="flex flex-col gap-1.5 pt-2">
              <label class="text-xs font-medium text-slate-500">O sube tu propio bloque de referencia (URL de imagen)</label>
              <input
                type="text"
                placeholder="https://ejemplo.com/otra-seccion-landing.jpg"
                class="glass-input text-xs"
                value={customImage}
                onChange={e => {
                  setCustomImage(e.target.value);
                  setSelectedSection('');
                }}
              />
            </div>
          </div>

          {/* Config & Dropdowns */}
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Palette class="w-3.5 h-3.5 text-purple-400" />
                Color de Fondo
              </label>
              <div class="flex items-center gap-2">
                <input 
                  type="color" 
                  class="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                />
                <input 
                  type="text"
                  class="glass-input text-xs flex-1 text-center font-mono py-2"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Tamaño de Sección</label>
              <select class="glass-input bg-slate-950" value={format} onChange={e => setFormat(e.target.value)}>
                <option value="16:9">Largo (16:9 - Escritorio)</option>
                <option value="1:1">Cuadrado (1:1 - Redes/Móvil)</option>
                <option value="9:16">Alto (9:16 - Móvil Vertical)</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Idioma</label>
              <select class="glass-input bg-slate-950" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="es">Español</option>
                <option value="en">Inglés</option>
                <option value="pt">Portugués</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Motor de Generación</label>
              <select class="glass-input bg-slate-950" value={engine} onChange={e => setEngine(e.target.value)}>
                <option value="kie-ai">Kie.ai (Flux Kontext)</option>
                <option value="openai">OpenAI (DALL-E 3)</option>
              </select>
            </div>
          </div>

          {/* Custom style Prompt */}
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-400">Personalización avanzada del diseño</label>
            <input 
              type="text" 
              placeholder="Ej: Incluir colores pastel, agregar sombras, hacer el diseño ultra-moderno..." 
              class="glass-input"
              value={customStyle}
              onChange={e => setCustomStyle(e.target.value)}
            />
          </div>

          {/* Generation Trigger Button */}
          <div class="pt-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <span class="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <HelpCircle class="w-4 h-4 text-purple-400" />
              Esta generación consumirá **1 crédito** de tu saldo de creador.
            </span>
            
            <button 
              type="submit"
              disabled={isGeneratingImages || !selectedProduct}
              class="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-extrabold text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isGeneratingImages ? (
                <>
                  <RefreshCw class="w-4 h-4 animate-spin" />
                  <span>Generando sección...</span>
                </>
              ) : (
                <>
                  <Wand2 class="w-4 h-4" />
                  <span>Generar Sección de Landing</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Preview Box - 4 Cols */}
        <div class="lg:col-span-4 space-y-6">
          <h3 class="font-bold text-lg text-slate-200">Previsualización de la Sección</h3>
          
          <div class="glass-panel border border-white/10 rounded-3xl p-6 bg-slate-900/40 text-center flex flex-col items-center justify-center min-h-[400px]">
            {isGeneratingImages ? (
              <div class="space-y-4 animate-pulse">
                <RefreshCw class="w-12 h-12 mx-auto text-purple-400 animate-spin" />
                <h4 class="text-sm font-bold text-slate-200">Dibujando sección...</h4>
                <p class="text-xs text-slate-500 max-w-[200px] mx-auto">La IA está estructurando la disposición del producto, las descripciones y el botón de CTA.</p>
              </div>
            ) : successImages.length > 0 ? (
              <div class="space-y-4 w-full">
                <div class="rounded-2xl overflow-hidden border border-white/10 shadow-lg relative bg-slate-950 aspect-video">
                  <img src={successImages[0].image_url} alt="Result" class="w-full h-full object-cover" />
                </div>
                <div class="flex gap-2">
                  <a 
                    href={successImages[0].image_url}
                    download="creator-shopy-seccion.webp"
                    target="_blank"
                    rel="noreferrer"
                    class="flex-1 py-3 text-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Download class="w-3.5 h-3.5" />
                    <span>Descargar Imagen</span>
                  </a>
                </div>
              </div>
            ) : (
              <div class="space-y-4 text-slate-600">
                <FileImage class="w-16 h-16 mx-auto stroke-1" />
                <p class="text-xs max-w-[200px] mx-auto text-slate-400">Selecciona los parámetros de la izquierda y haz clic en "Generar" para ver los resultados.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Grid */}
      {selectedProject && (
        <div class="space-y-4 pt-6 border-t border-white/5">
          <h3 class="font-bold text-lg text-slate-200">Historial de Secciones del Proyecto</h3>
          {generatedImages.length === 0 ? (
            <p class="text-sm text-slate-500">No hay bloques generados para este proyecto.</p>
          ) : (
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {generatedImages.map(img => (
                <div 
                  key={img.id} 
                  class="glass-panel border border-white/10 rounded-2xl overflow-hidden bg-slate-950 group relative aspect-square cursor-pointer"
                >
                  <img src={img.image_url} alt="Generated landing block" class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                    <div class="flex justify-end">
                      <span class="bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">{img.model}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-[9px] text-white truncate max-w-[80px] font-semibold">{img.prompt}</span>
                      <a href={img.image_url} download class="p-1 rounded bg-white/20 text-white hover:bg-white/40"><Download class="w-3 h-3" /></a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
