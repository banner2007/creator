import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { Sparkles, Sliders, Image, Download, Wand2, RefreshCw, Layers, ZoomIn } from 'lucide-react';

export default function ImageGenPage() {
  const {
    selectedProject,
    generatedImages,
    isGeneratingImages,
    generateImages,
    fetchProjectImages,
    user
  } = useStore();

  // Form State
  const [product, setProduct] = useState('');
  const [style, setStyle] = useState('premium');
  const [ratio, setRatio] = useState('16:9');
  const [count, setCount] = useState(1);

  // Detail Modal State
  const [activeImage, setActiveImage] = useState(null);
  const [bgRemoving, setBgRemoving] = useState(false);
  const [upscaling, setUpscaling] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectImages(selectedProject.id);
    }
  }, [selectedProject]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      alert('Por favor, selecciona o crea un proyecto en el Dashboard primero.');
      return;
    }
    if (!product.trim()) return;

    await generateImages(product, style, ratio, count, selectedProject.id);
    setProduct('');
  };

  const handleRemoveBg = async (imageUrl) => {
    setBgRemoving(true);
    try {
      const response = await fetch('/api/ai/remove-bg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useStore.getState().token}`
        },
        body: JSON.stringify({ imageUrl })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Fondo removido exitosamente (Simulación). Imagen actualizada.');
        if (activeImage) setActiveImage(data.resultUrl);
        fetchProjectImages(selectedProject.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBgRemoving(false);
    }
  };

  const handleUpscale = async (imageUrl) => {
    setUpscaling(true);
    try {
      const response = await fetch('/api/ai/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useStore.getState().token}`
        },
        body: JSON.stringify({ imageUrl })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Imagen escalada a 4K exitosamente (Simulación).');
        if (activeImage) setActiveImage(data.resultUrl);
        fetchProjectImages(selectedProject.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpscaling(false);
    }
  };

  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <Sparkles class="w-8 h-8 text-purple-400 animate-pulse" />
          <span>Estudio de Fotografía IA</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Crea hermosas imágenes publicitarias para tus productos con el poder de Kie.ai.
        </p>
      </div>

      {!selectedProject ? (
        <div class="glass-panel p-12 text-center rounded-3xl border border-white/10">
          <p class="text-slate-400">Por favor selecciona un proyecto en la barra de navegación para usar el Estudio IA.</p>
        </div>
      ) : (
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel */}
          <div class="lg:col-span-4 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <h3 class="font-bold text-lg text-slate-200 flex items-center gap-2">
              <Sliders class="w-5 h-5 text-purple-400" />
              Parámetros de Captura
            </h3>

            <form onSubmit={handleGenerate} class="space-y-5">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Descripción del Producto</label>
                <textarea 
                  rows="3"
                  placeholder="Ej: Un frasco de serum cosmético sobre una roca con agua, hojas de menta alrededor..." 
                  class="glass-input resize-none"
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  required 
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Estilo Artístico</label>
                <select 
                  class="glass-input bg-slate-900"
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                >
                  <option value="premium">Premium Publicitario</option>
                  <option value="minimalist">Minimalista</option>
                  <option value="neon">Neon Brillante</option>
                  <option value="cyberpunk">Cyberpunk / Tech</option>
                  <option value="cinematic">Cinemático Dramático</option>
                  <option value="3d-render">Render 3D</option>
                  <option value="nature">Natural / Orgánico</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-400">Formato / Relación</label>
                  <select 
                    class="glass-input bg-slate-900"
                    value={ratio}
                    onChange={e => setRatio(e.target.value)}
                  >
                    <option value="16:9">16:9 (Horizontal)</option>
                    <option value="1:1">1:1 (Cuadrado)</option>
                    <option value="9:16">9:16 (Vertical)</option>
                    <option value="4:3">4:3 (Cámara)</option>
                  </select>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-400">Cantidad</label>
                  <select 
                    class="glass-input bg-slate-900"
                    value={count}
                    onChange={e => setCount(parseInt(e.target.value))}
                  >
                    <option value="1">1 Imagen (1 cr.)</option>
                    <option value="2">2 Imágenes (2 cr.)</option>
                    <option value="3">3 Imágenes (3 cr.)</option>
                    <option value="4">4 Imágenes (4 cr.)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isGeneratingImages || !product.trim()}
                class="w-full py-4 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_25px_rgba(147,51,234,0.4)] transition-all duration-300 transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-white"
              >
                {isGeneratingImages ? (
                  <>
                    <RefreshCw class="w-4 h-4 animate-spin" />
                    <span>Generando con Kie.ai...</span>
                  </>
                ) : (
                  <>
                    <Wand2 class="w-4 h-4" />
                    <span>Generar Imágenes</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Gallery */}
          <div class="lg:col-span-8 space-y-6">
            <div class="flex justify-between items-center">
              <h3 class="font-bold text-lg text-slate-200">Galería de Imágenes Generadas</h3>
              <span class="text-xs text-slate-500">Proyecto: {selectedProject.name}</span>
            </div>

            {generatedImages.length === 0 && !isGeneratingImages ? (
              <div class="glass-panel p-16 text-center text-slate-500 border border-white/10 rounded-3xl">
                <Image class="w-16 h-16 mx-auto mb-4 stroke-1 text-slate-600" />
                <p class="text-sm">No hay imágenes generadas en este proyecto todavía.</p>
                <p class="text-xs text-slate-600 mt-2">Usa el panel de la izquierda para generar imágenes comerciales.</p>
              </div>
            ) : (
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {isGeneratingImages && (
                  <div class="glass-panel border-purple-500/30 bg-purple-600/[0.02] aspect-square rounded-2xl flex flex-col items-center justify-center text-center p-6 border border-dashed animate-pulse">
                    <RefreshCw class="w-10 h-10 text-purple-400 animate-spin mb-4" />
                    <h5 class="text-slate-300 text-sm font-bold">Generando Toma...</h5>
                    <p class="text-xs text-slate-500 mt-1 max-w-[150px]">Kie.ai está procesando tu prompt comercial.</p>
                  </div>
                )}
                
                {generatedImages.map(img => (
                  <div 
                    key={img.id} 
                    class="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900 aspect-square cursor-pointer shadow-lg"
                    onClick={() => setActiveImage(img)}
                  >
                    <img 
                      src={img.image_url} 
                      alt="Generated" 
                      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Hover controls */}
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                      <div class="flex justify-end">
                        <span class="bg-black/50 text-white backdrop-blur-md text-[10px] px-2 py-0.5 rounded-full border border-white/10 capitalize font-medium">
                          {img.resolution}
                        </span>
                      </div>
                      
                      <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold text-white truncate max-w-[120px]">{img.prompt}</p>
                        <a 
                          href={img.image_url} 
                          download={`ai-image-${img.id}.webp`}
                          onClick={e => e.stopPropagation()}
                          class="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all text-white"
                          title="Descargar Imagen"
                        >
                          <Download class="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Detail / Edit Modal */}
      {activeImage && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-8">
          <div class="w-full max-w-4xl glass-panel border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row relative">
            <button 
              onClick={() => setActiveImage(null)}
              class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-lg font-bold border border-white/10 transition-all"
            >
              &times;
            </button>
            
            {/* Left Preview */}
            <div class="flex-1 bg-slate-950 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/5 max-h-[50vh] md:max-h-[80vh]">
              <img 
                src={activeImage.image_url} 
                alt="Enlarged" 
                class="max-w-full max-h-full object-contain rounded-xl"
              />
            </div>
            
            {/* Right Controls */}
            <div class="w-full md:w-80 p-8 flex flex-col justify-between bg-slate-900/60 max-h-[50vh] md:max-h-[80vh] overflow-y-auto">
              <div class="space-y-6">
                <div>
                  <span class="text-xs text-purple-400 font-bold uppercase tracking-wider">AI Generated Asset</span>
                  <h4 class="text-xl font-bold text-slate-100 mt-2">{activeImage.prompt}</h4>
                  <p class="text-xs text-slate-500 mt-1 font-mono">ID: {activeImage.id}</p>
                </div>

                <div class="border-t border-white/5 pt-6 space-y-4">
                  <h5 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones Inteligentes</h5>
                  
                  <button 
                    onClick={() => handleRemoveBg(activeImage.image_url)}
                    disabled={bgRemoving}
                    class="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all flex items-center justify-center gap-2 text-slate-300 disabled:opacity-50"
                  >
                    {bgRemoving ? <RefreshCw class="w-4 h-4 animate-spin" /> : <Layers class="w-4 h-4 text-purple-400" />}
                    <span>{bgRemoving ? 'Removiendo Fondo...' : 'Remover Fondo'}</span>
                  </button>

                  <button 
                    onClick={() => handleUpscale(activeImage.image_url)}
                    disabled={upscaling}
                    class="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all flex items-center justify-center gap-2 text-slate-300 disabled:opacity-50"
                  >
                    {upscaling ? <RefreshCw class="w-4 h-4 animate-spin" /> : <ZoomIn class="w-4 h-4 text-blue-400" />}
                    <span>{upscaling ? 'Escalando...' : 'Escalar a 4K'}</span>
                  </button>
                </div>
              </div>

              <div class="pt-6 border-t border-white/5">
                <a 
                  href={activeImage.image_url} 
                  download={`ai-image-${activeImage.id}.webp`}
                  class="w-full py-3.5 text-center block text-sm font-bold bg-purple-600 hover:bg-purple-500 rounded-xl text-white shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Download class="w-4 h-4" />
                  <span>Descargar Archivo</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
