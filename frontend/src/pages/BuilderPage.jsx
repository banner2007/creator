import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUp, ArrowDown, Trash2, Plus, Monitor, Tablet, Smartphone, 
  Sparkles, Globe, CloudLightning, Eye, ArrowLeft, RefreshCw, CheckCircle, Image as ImageIcon 
} from 'lucide-react';

export default function BuilderPage() {
  const navigate = useNavigate();

  // Zustand Store
  const {
    selectedProject,
    selectedLanding,
    sections,
    previewMode,
    activeSectionIdx,
    saveStatus,
    generatedImages,
    setSections,
    updateSectionContent,
    addSection,
    removeSection,
    reorderSections,
    setPreviewMode,
    setActiveSectionIdx,
    publishLanding,
    fetchProjectImages
  } = useStore();

  // Local State
  const [publishing, setPublishing] = useState(false);
  const [pubResult, setPubResult] = useState(null);
  
  // AI SEO State
  const [seoModal, setSeoModal] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [seoTopic, setSeoTopic] = useState('');
  const [generatingSeo, setGeneratingSeo] = useState(false);

  // Gallery Asset Picker State
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [pickingTarget, setPickingTarget] = useState(null); // { sectionIdx, imageIdx }

  useEffect(() => {
    if (!selectedLanding) {
      navigate('/');
    } else if (selectedProject) {
      fetchProjectImages(selectedProject.id);
      setSeoTitle(selectedLanding.seo_title || '');
      setSeoDesc(selectedLanding.seo_description || '');
    }
  }, [selectedLanding]);

  if (!selectedLanding) return null;

  // Publish handler
  const handlePublish = async () => {
    setPublishing(true);
    const result = await publishLanding(selectedLanding.id);
    if (result && !result.error) {
      setPubResult(result);
    } else {
      alert(result?.error || 'Error al publicar la página');
    }
    setPublishing(false);
  };

  // Simulated AI SEO generation
  const handleGenerateSEO = async (e) => {
    e.preventDefault();
    if (!seoTopic.trim()) return;
    setGeneratingSeo(true);
    
    // Simulate AI metadata generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const generatedTitle = `Adquiere ${selectedLanding.title} - ${seoTopic}`;
    const generatedDesc = `Descubre el mejor ${selectedLanding.title} diseñado especialmente para ${seoTopic}. Alta calidad con garantía, envíos rápidos nacionales. Compra hoy con 50% de descuento.`;
    
    setSeoTitle(generatedTitle);
    setSeoDesc(generatedDesc);
    setGeneratingSeo(false);
  };

  const handleSaveSEO = () => {
    // Write SEO metadata to page details (this triggers autosave via store properties)
    useStore.setState({
      selectedLanding: {
        ...selectedLanding,
        seo_title: seoTitle,
        seo_description: seoDesc
      }
    });
    // Trigger store save
    useStore.getState().triggerAutosave();
    setSeoModal(false);
  };

  // Open asset picker for section images
  const openImagePicker = (sectionIdx, imageIdx = null) => {
    setPickingTarget({ sectionIdx, imageIdx });
    setShowImagePicker(true);
  };

  const selectAsset = (url) => {
    if (!pickingTarget) return;
    const { sectionIdx, imageIdx } = pickingTarget;
    
    if (imageIdx !== null) {
      // Modify index inside gallery list
      const section = sections[sectionIdx];
      const list = [...(section.content_json.images || [])];
      list[imageIdx] = url;
      updateSectionContent(sectionIdx, { images: list });
    } else {
      // Standard image update (Hero backdrop or specific single image block)
      updateSectionContent(sectionIdx, { coverImage: url });
    }
    
    setShowImagePicker(false);
    setPickingTarget(null);
  };

  return (
    <div class="h-screen flex flex-col bg-slate-950 overflow-hidden relative">
      
      {/* 1. TOP BAR */}
      <header class="glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0 relative z-20">
        <div class="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft class="w-4 h-4" />
          </button>
          <div>
            <h3 class="font-bold text-slate-200">{selectedLanding.title}</h3>
            <span class="text-xs text-slate-500">Editor Visual &bull; {selectedProject?.name}</span>
          </div>
        </div>

        {/* Device preview toggles */}
        <div class="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          <button 
            onClick={() => setPreviewMode('desktop')}
            class={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Escritorio"
          >
            <Monitor class="w-4 h-4" />
          </button>
          <button 
            onClick={() => setPreviewMode('tablet')}
            class={`p-2 rounded-lg transition-all ${previewMode === 'tablet' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Tablet"
          >
            <Tablet class="w-4 h-4" />
          </button>
          <button 
            onClick={() => setPreviewMode('mobile')}
            class={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Móvil"
          >
            <Smartphone class="w-4 h-4" />
          </button>
        </div>

        {/* Saving Status & Publish Actions */}
        <div class="flex items-center gap-4">
          {/* Status */}
          <div class="flex items-center gap-2 text-xs text-slate-400">
            {saveStatus === 'saving' && (
              <>
                <RefreshCw class="w-3.5 h-3.5 text-purple-400 animate-spin" />
                <span>Guardando...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle class="w-3.5 h-3.5 text-green-400" />
                <span>Autoguardado</span>
              </>
            )}
            {saveStatus === 'error' && (
              <span class="text-red-400">Error de conexión</span>
            )}
          </div>

          <button 
            onClick={() => setSeoModal(true)}
            class="px-4 py-2 rounded-xl border border-purple-500/30 text-purple-300 text-xs font-semibold bg-purple-600/5 hover:bg-purple-600/15 transition-all flex items-center gap-1.5"
          >
            <Sparkles class="w-3.5 h-3.5 animate-pulse" />
            <span>Asistente SEO</span>
          </button>

          <button 
            onClick={handlePublish}
            disabled={publishing}
            class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all shadow-lg shadow-purple-500/25 flex items-center gap-1.5 disabled:opacity-50"
          >
            {publishing ? <RefreshCw class="w-3.5 h-3.5 animate-spin" /> : <CloudLightning class="w-3.5 h-3.5" />}
            <span>Publicar</span>
          </button>
        </div>
      </header>

      {/* 2. LOWER EDITOR WORKSPACE */}
      <div class="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL: Section Structure */}
        <aside class="w-64 glass-panel border-r border-white/5 flex flex-col justify-between overflow-y-auto shrink-0 relative z-10 p-5 space-y-6">
          <div class="space-y-4">
            <h4 class="font-bold text-xs uppercase tracking-wider text-slate-400">Estructura del Embudo</h4>
            <div class="space-y-2">
              {sections.map((sec, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveSectionIdx(idx)}
                  class={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    activeSectionIdx === idx 
                      ? 'bg-purple-600/10 border-purple-500/40 text-purple-200' 
                      : 'bg-white/[0.01] border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span class="text-xs font-semibold capitalize font-mono">{idx + 1}. {sec.type}</span>
                  
                  {/* Ordering / Deleting Buttons */}
                  <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); if (idx > 0) reorderSections(idx, idx - 1); }}
                      class="p-1 rounded hover:bg-white/10"
                    >
                      <ArrowUp class="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if (idx < sections.length - 1) reorderSections(idx, idx + 1); }}
                      class="p-1 rounded hover:bg-white/10"
                    >
                      <ArrowDown class="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeSection(idx); }}
                      class="p-1 rounded hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Add Section Button */}
          <div class="border-t border-white/5 pt-4">
            <h4 class="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Agregar Bloque</h4>
            <div class="grid grid-cols-2 gap-2">
              {['hero', 'benefits', 'offer', 'reviews', 'faq', 'gallery'].map(type => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  class="px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all text-left text-xs capitalize text-slate-400 hover:text-white font-medium"
                >
                  + {type}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER PANEL: Device Frame & Preview Canvas */}
        <section class="flex-1 bg-slate-950/40 p-8 flex items-center justify-center overflow-y-auto relative">
          <div 
            class="transition-all duration-300 shadow-2xl relative bg-slate-950 border border-white/5 min-h-[70vh] rounded-2xl overflow-y-auto"
            style={{
              width: previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '768px' : '100%',
              maxHeight: '100%'
            }}
          >
            {/* Compiling Preview Layout */}
            {sections.length === 0 ? (
              <div class="p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[50vh]">
                <Plus class="w-12 h-12 stroke-1 animate-pulse text-purple-400" />
                <p class="text-sm mt-4">Comienza a agregar secciones en el panel izquierdo.</p>
              </div>
            ) : (
              <div class="divide-y divide-white/5 pointer-events-none">
                {sections.map((sec, idx) => (
                  <div 
                    key={idx} 
                    class={`relative group border ${activeSectionIdx === idx ? 'border-purple-500' : 'border-transparent'}`}
                  >
                    {/* Render visual layouts based on type */}
                    {sec.type === 'hero' && (
                      <div class="py-16 px-6 text-center relative overflow-hidden bg-slate-900/40">
                        <div class="max-w-xl mx-auto space-y-4">
                          <h1 class="text-3xl font-extrabold text-white">{sec.content_json.title || 'Título'}</h1>
                          <p class="text-sm text-slate-400">{sec.content_json.subtitle || 'Subtítulo'}</p>
                          <button class="px-5 py-2.5 rounded-xl bg-purple-600 text-xs font-bold text-white mt-4 inline-block">
                            {sec.content_json.ctaText || 'Comprar'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {sec.type === 'benefits' && (
                      <div class="py-16 px-6 bg-slate-900/60">
                        <h2 class="text-xl font-bold text-center text-slate-200 mb-8">{sec.content_json.title || 'Beneficios'}</h2>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                          {(sec.content_json.items || []).map((item, i) => (
                            <div key={i} class="p-4 rounded-xl bg-white/5 border border-white/5">
                              <h4 class="font-bold text-sm text-purple-300">{item.title}</h4>
                              <p class="text-xs text-slate-400 mt-1">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {sec.type === 'offer' && (
                      <div class="py-16 px-6 bg-slate-950 text-center">
                        <div class="max-w-md mx-auto p-6 rounded-2xl bg-white/5 border border-white/10">
                          {sec.content_json.badge && (
                            <span class="px-2.5 py-1 rounded-full text-[10px] bg-purple-600 text-white font-bold inline-block mb-3">{sec.content_json.badge}</span>
                          )}
                          <h3 class="font-bold text-lg">{sec.content_json.title}</h3>
                          <div class="my-4 flex items-center justify-center gap-2">
                            <span class="line-through text-xs text-slate-500">${sec.content_json.originalPrice}</span>
                            <span class="text-2xl font-bold text-purple-400">${sec.content_json.price}</span>
                          </div>
                          <button class="px-6 py-3 bg-purple-600 text-xs font-bold rounded-lg text-white w-full">{sec.content_json.buttonText}</button>
                        </div>
                      </div>
                    )}

                    {sec.type === 'faq' && (
                      <div class="py-16 px-6 bg-slate-900/20 max-w-xl mx-auto">
                        <h3 class="font-bold text-center mb-6">{sec.content_json.title}</h3>
                        <div class="space-y-3">
                          {(sec.content_json.questions || []).map((q, i) => (
                            <div key={i} class="p-3 rounded-lg bg-white/5 text-left">
                              <h5 class="text-xs font-bold text-purple-300">Q: {q.q}</h5>
                              <p class="text-xs text-slate-400 mt-1">A: {q.a}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sec.type === 'reviews' && (
                      <div class="py-16 px-6 bg-slate-900/50">
                        <h3 class="font-bold text-center mb-8">{sec.content_json.title}</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                          {(sec.content_json.reviews || []).map((r, i) => (
                            <div key={i} class="p-4 rounded-xl bg-white/5 border border-white/5">
                              <p class="text-xs italic text-slate-300">"{r.comment}"</p>
                              <h5 class="text-xs font-bold text-purple-300 mt-3">{r.name} - ⭐ {r.rating}</h5>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sec.type === 'gallery' && (
                      <div class="py-16 px-6 bg-slate-950">
                        <h3 class="font-bold text-center mb-6">{sec.content_json.title}</h3>
                        <div class="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                          {(sec.content_json.images || []).map((img, i) => (
                            <div key={i} class="aspect-square bg-slate-900 border border-white/5 rounded-lg overflow-hidden flex items-center justify-center">
                              {img ? <img src={img} alt="" class="w-full h-full object-cover" /> : <ImageIcon class="w-6 h-6 text-slate-600" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL: Content Settings Editor */}
        <aside class="w-80 glass-panel border-l border-white/5 flex flex-col justify-between overflow-y-auto shrink-0 relative z-10 p-6">
          {activeSectionIdx === null ? (
            <div class="h-full flex flex-col items-center justify-center text-center text-slate-500">
              <Sliders class="w-10 h-10 mb-3 stroke-1 text-slate-600" />
              <p class="text-xs">Selecciona un bloque en la estructura o en el lienzo para ajustar sus contenidos.</p>
            </div>
          ) : (
            <div class="space-y-6">
              <div class="flex justify-between items-center pb-4 border-b border-white/5">
                <h4 class="font-bold text-sm capitalize text-slate-200">Ajustes: {sections[activeSectionIdx].type}</h4>
                <button 
                  onClick={() => setActiveSectionIdx(null)}
                  class="text-xs text-slate-400 hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              {/* DYNAMIC FORM COMPONENT INPUTS BY SECTION TYPE */}
              {sections[activeSectionIdx].type === 'hero' && (
                <div class="space-y-4">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-slate-400 font-semibold">Título Principal</label>
                    <input 
                      type="text" 
                      class="glass-input" 
                      value={sections[activeSectionIdx].content_json.title || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { title: e.target.value })}
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-slate-400 font-semibold">Subtítulo</label>
                    <textarea 
                      class="glass-input resize-none" 
                      rows="3"
                      value={sections[activeSectionIdx].content_json.subtitle || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { subtitle: e.target.value })}
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-slate-400 font-semibold">Texto del Botón</label>
                    <input 
                      type="text" 
                      class="glass-input" 
                      value={sections[activeSectionIdx].content_json.ctaText || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { ctaText: e.target.value })}
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-slate-400 font-semibold">Destino Link</label>
                    <input 
                      type="text" 
                      class="glass-input" 
                      value={sections[activeSectionIdx].content_json.ctaLink || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { ctaLink: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {sections[activeSectionIdx].type === 'benefits' && (
                <div class="space-y-4">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-slate-400 font-semibold">Título del Bloque</label>
                    <input 
                      type="text" 
                      class="glass-input" 
                      value={sections[activeSectionIdx].content_json.title || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { title: e.target.value })}
                    />
                  </div>
                  
                  {/* Mapping benefits items */}
                  <div class="space-y-3 border-t border-white/5 pt-3">
                    <span class="text-xs font-semibold text-slate-400">Items (Máx 3)</span>
                    {(sections[activeSectionIdx].content_json.items || []).map((item, idx) => (
                      <div key={idx} class="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2">
                        <input 
                          type="text" 
                          placeholder="Título del Item"
                          class="glass-input w-full"
                          value={item.title || ''}
                          onChange={e => {
                            const list = [...sections[activeSectionIdx].content_json.items];
                            list[idx].title = e.target.value;
                            updateSectionContent(activeSectionIdx, { items: list });
                          }}
                        />
                        <input 
                          type="text" 
                          placeholder="Detalle"
                          class="glass-input w-full"
                          value={item.description || ''}
                          onChange={e => {
                            const list = [...sections[activeSectionIdx].content_json.items];
                            list[idx].description = e.target.value;
                            updateSectionContent(activeSectionIdx, { items: list });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sections[activeSectionIdx].type === 'offer' && (
                <div class="space-y-4">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-slate-400 font-semibold">Título de Oferta</label>
                    <input 
                      type="text" 
                      class="glass-input" 
                      value={sections[activeSectionIdx].content_json.title || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { title: e.target.value })}
                    />
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs text-slate-400 font-semibold">Precio Oferta ($)</label>
                      <input 
                        type="text" 
                        class="glass-input" 
                        value={sections[activeSectionIdx].content_json.price || ''}
                        onChange={e => updateSectionContent(activeSectionIdx, { price: e.target.value })}
                      />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <label class="text-xs text-slate-400 font-semibold">Precio Original ($)</label>
                      <input 
                        type="text" 
                        class="glass-input" 
                        value={sections[activeSectionIdx].content_json.originalPrice || ''}
                        onChange={e => updateSectionContent(activeSectionIdx, { originalPrice: e.target.value })}
                      />
                    </div>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-slate-400 font-semibold">Badge de Descuento</label>
                    <input 
                      type="text" 
                      class="glass-input" 
                      value={sections[activeSectionIdx].content_json.badge || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { badge: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {sections[activeSectionIdx].type === 'gallery' && (
                <div class="space-y-4">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-slate-400 font-semibold">Título de la Galería</label>
                    <input 
                      type="text" 
                      class="glass-input" 
                      value={sections[activeSectionIdx].content_json.title || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { title: e.target.value })}
                    />
                  </div>
                  
                  {/* Mapping gallery items */}
                  <div class="space-y-3 border-t border-white/5 pt-3">
                    <span class="text-xs font-semibold text-slate-400">Imágenes (Click para cambiar)</span>
                    
                    {/* Render slots for 3 images */}
                    {[0, 1, 2].map((idx) => {
                      const img = (sections[activeSectionIdx].content_json.images || [])[idx];
                      return (
                        <div 
                          key={idx}
                          onClick={() => openImagePicker(activeSectionIdx, idx)}
                          class="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all"
                        >
                          <span class="text-xs text-slate-400">Imagen {idx + 1}</span>
                          {img ? (
                            <img src={img} alt="Thumb" class="w-10 h-10 object-cover rounded-lg border border-white/10" />
                          ) : (
                            <div class="w-10 h-10 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-slate-600">
                              +
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* 3. AI SEO MODAL */}
      {seoModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div class="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative">
            <h3 class="text-xl font-bold mb-2 flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-purple-400 animate-pulse" />
              Asistente de Redacción SEO con IA
            </h3>
            <p class="text-xs text-slate-400 mb-6">Genera automáticamente Metaetiquetas SEO de alta calidad para indexación en buscadores.</p>
            
            <div class="space-y-5">
              <form onSubmit={handleGenerateSEO} class="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ej: Calzado deportivo cómodo para correr maratones" 
                  class="glass-input flex-1"
                  value={seoTopic}
                  onChange={e => setSeoTopic(e.target.value)}
                  required 
                />
                <button 
                  type="submit"
                  disabled={generatingSeo}
                  class="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all shrink-0 flex items-center gap-1.5"
                >
                  {generatingSeo ? <RefreshCw class="w-3.5 h-3.5 animate-spin" /> : <Sparkles class="w-3.5 h-3.5" />}
                  <span>Generar</span>
                </button>
              </form>

              <div class="border-t border-white/5 pt-5 space-y-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs text-slate-400 font-semibold">Meta Title</label>
                  <input 
                    type="text" 
                    class="glass-input" 
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                  />
                </div>
                
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs text-slate-400 font-semibold">Meta Description</label>
                  <textarea 
                    class="glass-input resize-none" 
                    rows="3"
                    value={seoDesc}
                    onChange={e => setSeoDesc(e.target.value)}
                  />
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-all"
                  onClick={() => setSeoModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSaveSEO}
                  class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition-all"
                >
                  Aplicar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. IMAGE PICKER MODAL (PROJECT GENERATED ASSETS) */}
      {showImagePicker && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div class="w-full max-w-2xl glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative">
            <h3 class="text-lg font-bold mb-2">Seleccionar Asset Comercial</h3>
            <p class="text-xs text-slate-400 mb-6">Elige una imagen que hayas generado mediante IA en este proyecto.</p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[40vh] overflow-y-auto p-1">
              {generatedImages.length === 0 ? (
                <div class="col-span-full py-8 text-center text-slate-500 text-xs">
                  Aún no has generado ninguna imagen con IA para este proyecto.
                </div>
              ) : (
                generatedImages.map(img => (
                  <div 
                    key={img.id}
                    onClick={() => selectAsset(img.image_url)}
                    class="aspect-square rounded-xl overflow-hidden border border-white/10 bg-slate-900 cursor-pointer hover:border-purple-500 transition-all relative group"
                  >
                    <img src={img.image_url} alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                ))
              )}
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t border-white/5 mt-6">
              <button 
                type="button" 
                class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-all"
                onClick={() => { setShowImagePicker(false); setPickingTarget(null); }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. PUBLISHED SUCCESS MODAL */}
      {pubResult && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div class="w-full max-w-md glass-panel p-8 rounded-3xl border border-purple-500/30 text-center relative shadow-2xl">
            <div class="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mx-auto mb-6">
              <CheckCircle class="w-8 h-8" />
            </div>

            <h3 class="text-2xl font-bold text-white mb-2">¡Página Publicada Exitosamente!</h3>
            <p class="text-sm text-slate-400 max-w-sm mx-auto mb-6">Tu landing page ya está en vivo y optimizada en la CDN para vender tus productos.</p>
            
            <div class="p-4 rounded-xl bg-purple-600/10 border border-purple-500/20 text-sm font-mono break-all mb-8">
              <span class="text-purple-300">https://{pubResult.domain}</span>
            </div>

            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <a 
                href={pubResult.url} 
                target="_blank" 
                rel="noreferrer"
                class="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-bold text-white transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5"
              >
                <Eye class="w-4 h-4" />
                <span>Ver Landing</span>
              </a>
              <button 
                onClick={() => setPubResult(null)}
                class="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold text-slate-300 transition-all border border-white/10"
              >
                Volver al Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
