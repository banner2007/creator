import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUp, ArrowDown, Trash2, Plus, Monitor, Tablet, Smartphone, 
  Sparkles, Globe, CloudLightning, Eye, ArrowLeft, RefreshCw, CheckCircle, Image as ImageIcon,
  Sliders
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
          >            {/* Compiling Preview Layout */}
            {sections.length === 0 ? (
              <div class="p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[50vh]">
                <Plus class="w-12 h-12 stroke-1 animate-pulse text-purple-400" />
                <p class="text-sm mt-4">Comienza a agregar secciones en el panel izquierdo.</p>
              </div>
            ) : (
              <div 
                class={`transition-all duration-300 w-full ${
                  previewMode === 'desktop' ? 'bg-[#eef0f3] py-8 px-4 flex justify-center min-h-screen' : 'bg-white min-h-screen'
                }`}
              >
                <div 
                  class={`w-full divide-y divide-slate-100 bg-white pointer-events-none relative pb-24 ${
                    previewMode === 'desktop' ? 'max-w-[480px] shadow-2xl border border-slate-200/60 rounded-2xl overflow-hidden' : ''
                  }`}
                >
                  {sections.map((sec, idx) => (
                    <div 
                      key={idx} 
                      class={`relative group border-2 transition-all ${
                        activeSectionIdx === idx ? 'border-emerald-500 z-10' : 'border-transparent'
                      }`}
                    >
                      {/* Render visual layouts based on type */}
                      {sec.type === 'hero' && (
                        sec.content_json.coverImage && !sec.content_json.title && !sec.content_json.subtitle ? (
                          <div class="relative bg-white overflow-hidden">
                            <img src={sec.content_json.coverImage} alt="Hero Banner" class="w-full h-auto block" />
                          </div>
                        ) : (
                          <div 
                            class="py-16 px-6 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[280px]"
                            style={{
                              backgroundImage: sec.content_json.coverImage ? `linear-gradient(to bottom, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.95)), url(${sec.content_json.coverImage})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <div class="max-w-md mx-auto space-y-3 relative z-10 text-slate-900">
                              {sec.content_json.badge && (
                                <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full inline-block">
                                  {sec.content_json.badge}
                                </span>
                              )}
                              <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{sec.content_json.title || 'Título'}</h1>
                              {sec.content_json.subtitle && <p class="text-xs text-slate-500 max-w-sm mx-auto">{sec.content_json.subtitle}</p>}
                              {sec.content_json.ctaText && (
                                <button class="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white mt-2 shadow-lg shadow-emerald-500/25 inline-block anim-shake">
                                  {sec.content_json.ctaText}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      )}
                      
                      {sec.type === 'benefits' && (
                        <div class="py-12 px-6 bg-slate-50 text-slate-900 border-b border-slate-100">
                          <h2 class="text-lg font-black text-center text-slate-900 mb-6">{sec.content_json.title || 'Beneficios'}</h2>
                          <div class="grid grid-cols-1 gap-3 max-w-md mx-auto">
                            {(sec.content_json.items || []).map((item, i) => (
                              <div key={i} class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
                                <div class="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" class="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 class="font-bold text-xs text-slate-900">{item.title}</h4>
                                  <p class="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {sec.type === 'offer' && (
                        <div class="py-12 px-6 bg-white text-slate-800" id="offer">
                          <div class="max-w-md mx-auto p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-lg text-center">
                            {sec.content_json.badge && (
                              <span class="px-2.5 py-1 rounded-full text-[9px] bg-emerald-500 text-white font-black uppercase tracking-wider inline-block mb-3 animate-pulse">{sec.content_json.badge}</span>
                            )}
                            <h3 class="font-bold text-base text-slate-900">{sec.content_json.title}</h3>
                            <div class="my-3 flex flex-col items-center gap-1">
                              <span class="line-through text-xs text-slate-400">Antes ${sec.content_json.originalPrice}</span>
                              <div class="flex items-baseline justify-center">
                                <span class="text-3xl font-black text-emerald-600">${sec.content_json.price}</span>
                                <span class="text-slate-500 text-[10px] ml-1.5 font-bold">COP / Envío Gratis</span>
                              </div>
                            </div>
                            <button class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-xs font-black rounded-xl text-white w-full shadow-md shadow-emerald-500/20 transform active:scale-95 transition-all anim-shake">{sec.content_json.buttonText || 'PEDIR CON DESCUENTO'}</button>
                            {sec.content_json.features && (
                              <div class="mt-4 text-left border-t border-slate-200/60 pt-3">
                                <ul class="space-y-1.5">
                                  {(sec.content_json.features || []).map((f, i) => (
                                    <li key={i} class="flex items-center text-slate-600 text-[10px] font-medium">
                                      <div class="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-2 shrink-0">
                                        <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                      </div>
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {sec.type === 'faq' && (
                        <div class="py-12 px-6 bg-slate-50 text-slate-900 border-b border-slate-100">
                          <h3 class="font-bold text-center mb-6 text-sm uppercase tracking-wider text-slate-400">{sec.content_json.title}</h3>
                          <div class="space-y-3 max-w-md mx-auto">
                            {(sec.content_json.questions || []).map((q, i) => (
                              <div key={i} class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm text-left">
                                <h5 class="text-xs font-bold text-slate-900 flex items-start">
                                  <span class="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded mr-2 shrink-0 font-black">Q</span>
                                  {q.q}
                                </h5>
                                <p class="text-[11px] text-slate-500 mt-1.5 pl-6 leading-relaxed">{q.a}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sec.type === 'reviews' && (
                        <div class="py-12 px-6 bg-slate-50 border-b border-slate-100">
                          <h3 class="font-bold text-center mb-6 text-slate-900">{sec.content_json.title}</h3>
                          <div class="grid grid-cols-1 gap-3 max-w-md mx-auto">
                            {(sec.content_json.reviews || []).map((r, i) => (
                              <div key={i} class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div class="mb-2">
                                  <div class="flex text-amber-400 mb-2 text-xs">
                                    {Array(r.rating || 5).fill('').map((_, idx) => (
                                      <span key={idx}>★</span>
                                    ))}
                                  </div>
                                  <p class="text-xs italic text-slate-600">"{r.comment}"</p>
                                </div>
                                <div class="flex items-center gap-2 border-t border-slate-100 pt-2 mt-1">
                                  <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[9px] uppercase">
                                    {r.name ? r.name.charAt(0) : 'U'}
                                  </div>
                                  <div>
                                    <h5 class="text-slate-900 font-bold text-[10px] flex items-center gap-1">
                                      <span>{r.name}</span>
                                      <span class="text-[7px] bg-green-100 text-green-700 px-1.5 py-0.2 rounded-full font-bold">Verificado</span>
                                    </h5>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sec.type === 'gallery' && (
                        <div class="py-6 bg-white border-b border-slate-100">
                          {sec.content_json.title && <h3 class="font-bold text-center text-slate-950 mb-4 px-6 text-sm">{sec.content_json.title}</h3>}
                          <div class="grid grid-cols-1 gap-0 max-w-md mx-auto">
                            {(sec.content_json.images || []).filter(img => img).map((img, i) => (
                              <div key={i} class="bg-white overflow-hidden">
                                <img src={img} alt="" class="w-full h-auto block" />
                              </div>
                            ))}
                            {(sec.content_json.images || []).filter(img => !img).map((_, i) => (
                              <div key={i} class="p-6 border border-dashed border-slate-200 m-2 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 text-xs">
                                <ImageIcon class="w-5 h-5 mr-1" />
                                <span>Slot de imagen vacío</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Floating CTA simulation inside the canvas container */}
                  <div class="absolute bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur border-t border-slate-100 flex items-center justify-center z-20 shadow-[0_-4px_15px_rgba(0,0,0,0.04)]">
                    <button class="w-full text-center py-2.5 rounded-xl bg-emerald-500 text-white font-extrabold text-xs tracking-wide shadow-md shadow-emerald-500/10">
                      ¡PEDIR CON DESCUENTO!
                    </button>
                  </div>

                  {/* Floating WhatsApp simulation inside the canvas container */}
                  <div class="absolute bottom-16 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-green-500 shadow-lg text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="h-5 w-5 fill-white">
                      <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.742 3.052 9.376L1.054 31.28l6.156-1.968C9.758 30.98 12.762 32 16.004 32 24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.35 22.606c-.392 1.106-1.94 2.024-3.186 2.292-.854.182-1.968.326-5.72-1.23-4.802-1.99-7.892-6.86-8.132-7.178-.23-.318-1.938-2.58-1.938-4.922 0-2.342 1.228-3.494 1.664-3.972.392-.43 1.034-.612 1.648-.612.198 0 .376.01.536.018.478.02.716.048 1.032.796.392.934 1.348 3.276 1.466 3.514.12.238.24.556.08.874-.148.326-.278.47-.516.742-.238.272-.464.48-.702.772-.216.256-.46.53-.196.99.264.452 1.174 1.934 2.52 3.134 1.734 1.544 3.194 2.024 3.648 2.248.354.178.776.138 1.052-.158.348-.376.778-.998 1.216-1.612.31-.438.702-.494 1.094-.334.398.152 2.526 1.19 2.958 1.408.432.218.72.326.826.508.104.182.104 1.062-.288 2.168z"></path>
                    </svg>
                  </div>
                </div>
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
                  <div class="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                    <label class="text-xs text-slate-400 font-semibold flex items-center justify-between">
                      <span>Imagen de Fondo (Hero)</span>
                      {sections[activeSectionIdx].content_json.coverImage && (
                        <button
                          type="button"
                          onClick={() => updateSectionContent(activeSectionIdx, { coverImage: '' })}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                        >
                          Eliminar
                        </button>
                      )}
                    </label>
                    <div 
                      onClick={() => openImagePicker(activeSectionIdx)}
                      class="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all"
                    >
                      <span class="text-xs text-slate-500">Seleccionar Imagen</span>
                      {sections[activeSectionIdx].content_json.coverImage ? (
                        <img 
                          src={sections[activeSectionIdx].content_json.coverImage} 
                          alt="Hero Cover" 
                          class="w-10 h-10 object-cover rounded-lg border border-white/10" 
                        />
                      ) : (
                        <div class="w-10 h-10 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-slate-600">
                          +
                        </div>
                      )}
                    </div>
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
                    
                    {/* Render slots dynamically based on the current images array */}
                    {(sections[activeSectionIdx].content_json.images || []).map((img, idx) => (
                      <div 
                        key={idx}
                        onClick={() => openImagePicker(activeSectionIdx, idx)}
                        class="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-xs text-slate-400">Imagen {idx + 1}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const list = [...(sections[activeSectionIdx].content_json.images || [])];
                              list.splice(idx, 1);
                              updateSectionContent(activeSectionIdx, { images: list });
                            }}
                            className="text-[10px] text-red-500 hover:text-red-400 font-bold ml-2"
                          >
                            Eliminar
                          </button>
                        </div>
                        {img ? (
                          <img src={img} alt="Thumb" class="w-10 h-10 object-cover rounded-lg border border-white/10" />
                        ) : (
                          <div class="w-10 h-10 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-slate-600">
                            +
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const list = [...(sections[activeSectionIdx].content_json.images || [])];
                        list.push('');
                        updateSectionContent(activeSectionIdx, { images: list });
                      }}
                      className="w-full py-2.5 rounded-xl border border-dashed border-white/10 hover:border-white/20 text-xs font-semibold text-slate-400 hover:text-white transition-all bg-white/[0.005] hover:bg-white/[0.01] mt-2"
                    >
                      + Añadir Imagen a la Galería
                    </button>
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
