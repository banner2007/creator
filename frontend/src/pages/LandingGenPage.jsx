import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { 
  Sparkles, Sliders, Download, Wand2, RefreshCw, 
  FileImage, HelpCircle, Check, Search, Upload, Trash2, 
  ChevronLeft, ChevronRight, Palette 
} from 'lucide-react';

function TemplateCard({ template, isSelected, onSelect, getTemplateDownloadUrl, onDelete }) {
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadUrl = async () => {
      setIsLoading(true);
      const url = await getTemplateDownloadUrl(template.fullPath);
      if (active) {
        setImageUrl(url);
        setIsLoading(false);
      }
    };
    loadUrl();
    return () => { active = false; };
  }, [template.fullPath]);

  return (
    <div 
      onClick={onSelect}
      class={`glass-panel border rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 relative group ${
        isSelected
          ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500'
          : 'border-white/5 bg-white/[0.01] hover:border-white/20'
      }`}
    >
      <div class="aspect-square relative overflow-hidden bg-slate-950 flex items-center justify-center">
        {isLoading ? (
          <div class="animate-pulse flex flex-col items-center justify-center">
            <RefreshCw class="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        ) : (
          <img src={imageUrl} alt={template.name} class="w-full h-full object-cover" />
        )}
        
        {isSelected && (
          <div class="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white border border-purple-400 shadow-md">
              <Check class="w-4 h-4" />
            </div>
          </div>
        )}
        
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('¿Estás seguro de que deseas eliminar esta plantilla de referencia?')) {
              onDelete(template.name);
            }
          }}
          class="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-red-600/95 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
          title="Eliminar plantilla"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
      <div class="p-2.5">
        <h5 class="text-[10px] font-bold text-slate-200 truncate" title={template.name}>{template.name.replace(/\.[^/.]+$/, "")}</h5>
        <p class="text-[8px] text-slate-500 mt-0.5">Referencia Firebase</p>
      </div>
    </div>
  );
}

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
    fetchProjectImages,
    
    // Firebase templates
    firebaseTemplates,
    isLoadingTemplates,
    fetchFirebaseTemplates,
    getTemplateDownloadUrl,
    uploadFirebaseTemplate,
    deleteFirebaseTemplate
  } = useStore();

  // Form State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [format, setFormat] = useState('16:9');
  const [language, setLanguage] = useState('es');
  const [engine, setEngine] = useState('kie-ai'); // kie-ai or openai
  const [bgColor, setBgColor] = useState('#0f172a'); // default slate-900 background
  const [customStyle, setCustomStyle] = useState('');
  const [customImage, setCustomImage] = useState('');

  // Pagination & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  // Results State
  const [successImages, setSuccessImages] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchProjects();
    fetchFirebaseTemplates();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectImages(selectedProject.id);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (firebaseTemplates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(firebaseTemplates[0].name);
    }
  }, [firebaseTemplates]);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
    
    let refImageUrl = '';
    if (customImage.trim()) {
      refImageUrl = customImage.trim();
    } else if (selectedTemplate) {
      // Get high quality version URL from templates/WEBP_100%
      const highQualityPath = `templates/WEBP_100%/${selectedTemplate}`;
      refImageUrl = await getTemplateDownloadUrl(highQualityPath);
    }

    // Build rich prompt for landing section layout
    let promptText = `Landing page section composition. Product: ${prod.name}. Background color: ${bgColor}. Description: ${prod.description}. referencing selected composition layout.`;
    if (customStyle.trim()) {
      promptText += ` Style customization: ${customStyle}`;
    }

    const placeholderUrl = 'images.unsplash.com/photo-1523275335684-37898b6baf30';
    const prodCover = prod?.cover_image && !prod.cover_image.includes(placeholderUrl) ? prod.cover_image : '';

    const results = await generateImages(
      promptText,
      selectedTemplate || 'custom',
      format,
      1,
      selectedProject.id,
      engine,
      refImageUrl,
      prodCover
    );

    if (results && results.length > 0) {
      setSuccessImages(results);
      fetchProjectImages(selectedProject.id);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const success = await uploadFirebaseTemplate(file);
    setIsUploading(false);
    
    if (success) {
      // Select the newly uploaded template
      if (firebaseTemplates.length > 0) {
        setSelectedTemplate(firebaseTemplates[0].name);
      }
    }
  };

  // Filter and Paginate
  const filteredTemplates = firebaseTemplates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage) || 1;
  const displayedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

          {/* Section Type Selection from Firebase */}
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label class="text-xs font-semibold text-slate-400 block">2. Selecciona la Estructura / Tipo de Sección</label>
              
              {/* Actions & Search */}
              <div class="flex items-center gap-2">
                {/* Search input */}
                <div class="relative">
                  <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar plantilla..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    class="bg-slate-950/80 border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500/50 w-36 sm:w-44"
                  />
                </div>

                {/* Upload Button */}
                <label class="cursor-pointer bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all">
                  {isUploading ? (
                    <RefreshCw class="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload class="w-3 h-3" />
                  )}
                  <span>{isUploading ? 'Subiendo...' : 'Subir'}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    class="hidden" 
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            {/* Template Grid */}
            {isLoadingTemplates && firebaseTemplates.length === 0 ? (
              <div class="flex flex-col items-center justify-center py-10 space-y-2">
                <RefreshCw class="w-8 h-8 text-purple-400 animate-spin" />
                <p class="text-xs text-slate-400">Cargando catálogo de plantillas de Firebase...</p>
              </div>
            ) : (
              <div class="space-y-4">
                {displayedTemplates.length === 0 ? (
                  <div class="text-center py-8 border border-white/5 rounded-2xl bg-white/[0.01]">
                    <p class="text-xs text-slate-500">No se encontraron plantillas que coincidan con la búsqueda.</p>
                  </div>
                ) : (
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fadeIn">
                    {displayedTemplates.map(temp => (
                      <TemplateCard
                        key={temp.name}
                        template={temp}
                        isSelected={selectedTemplate === temp.name && !customImage}
                        onSelect={() => {
                          setSelectedTemplate(temp.name);
                          setCustomImage('');
                        }}
                        getTemplateDownloadUrl={getTemplateDownloadUrl}
                        onDelete={deleteFirebaseTemplate}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div class="flex items-center justify-between border-t border-white/5 pt-3">
                    <span class="text-[10px] text-slate-500">
                      Mostrando {Math.min(filteredTemplates.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredTemplates.length, currentPage * itemsPerPage)} de {filteredTemplates.length} plantillas
                    </span>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        class="p-1.5 rounded-lg border border-white/5 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                      >
                        <ChevronLeft class="w-4 h-4" />
                      </button>
                      <span class="text-xs text-slate-300 font-medium">{currentPage} / {totalPages}</span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        class="p-1.5 rounded-lg border border-white/5 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                      >
                        <ChevronRight class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Section Template URL */}
            <div class="flex flex-col gap-1.5 pt-2">
              <label class="text-xs font-medium text-slate-500">O ingresa un enlace directo a otra sección de landing de referencia</label>
              <input
                type="text"
                placeholder="https://ejemplo.com/otra-seccion-landing.jpg"
                class="glass-input text-xs"
                value={customImage}
                onChange={e => {
                  setCustomImage(e.target.value);
                  setSelectedTemplate('');
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
                <option value="kie-ai">Kie.ai (Flux Kontext - Composición)</option>
                <option value="openai">OpenAI (ChatGPT Imagen 2.0 - Creatividad)</option>
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
                      <a href={img.image_url} download class="p-1 rounded bg-white/20 text-white hover:bg-white/40"><Download class="w-3.5 h-3.5" /></a>
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
