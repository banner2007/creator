import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore.js';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUp, ArrowDown, Trash2, Plus, Monitor, Tablet, Smartphone, 
  Sparkles, Globe, CloudLightning, Eye, ArrowLeft, RefreshCw, CheckCircle, Image as ImageIcon,
  Sliders, Layers, MousePointer, Upload, FolderTree, Code, Shield, ShieldOff, Zap, X, PlusCircle, Star, Copy, ExternalLink
} from 'lucide-react';

  const getSectionTypeNameSpanish = (type) => {
    const map = {
      hero: 'Hero / Portada',
      offer: 'Oferta',
      benefits: 'Beneficios',
      comparison: 'Tabla Comparativa',
      faq: 'Preguntas Frecuentes',
      cta: 'Imagen + Botón',
      gallery: 'Galería',
      reviews: 'Testimonios'
    };
    return map[type] || type;
  };

  const getMatchingImageForSection = (sectionType, generatedImagesList) => {
    if (!generatedImagesList || generatedImagesList.length === 0) return null;
    
    let possibleKeywords = [];
    if (sectionType === 'hero') possibleKeywords = ['hero'];
    else if (sectionType === 'offer') possibleKeywords = ['oferta'];
    else if (sectionType === 'benefits') possibleKeywords = ['beneficios'];
    else if (sectionType === 'comparison') possibleKeywords = ['tabla-comparativa', 'comparison'];
    else if (sectionType === 'faq') possibleKeywords = ['preguntas-frecuentes', 'faq'];
    else if (sectionType === 'reviews') possibleKeywords = ['testimonios', 'reviews'];
    else if (sectionType === 'cta') possibleKeywords = ['cta', 'antes-despues', 'prueba-autoridad', 'modo-uso', 'logistica'];
    
    for (const kw of possibleKeywords) {
      const found = generatedImagesList.find(img => {
        const promptLower = (img.prompt || '').toLowerCase();
        return promptLower.includes(`[template: ${kw}`) || promptLower.includes(`/${kw}_`) || promptLower.includes(`\\${kw}_`);
      });
      if (found) return found.image_url;
    }
    return null;
  };

export default function BuilderPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
    fetchProjectImages,
    updateLandingMeta,
    uploadProjectAsset,
    deleteProjectImage
  } = useStore();

  // Local UI State
  const [publishing, setPublishing] = useState(false);
  const [pubResult, setPubResult] = useState(null);
  const [workspaceTheme, setWorkspaceTheme] = useState('dark'); // 'dark' | 'light'
  
  // Left Panel control
  const [activeLeftTab, setActiveLeftTab] = useState('secciones'); // 'secciones' | 'fotos' | 'botones' | 'subidos' | 'capas' | 'css'
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  
  // Active slot for image picking
  const [activeImageSlot, setActiveImageSlot] = useState(null); // { sectionIdx, field: 'coverImage' } or { sectionIdx, field: 'images', imageIdx: 0 }
  const [isUploading, setIsUploading] = useState(false);

  // Drag and drop states
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const selectAndAutoPullSection = (idx) => {
    setActiveSectionIdx(idx);
    const section = sections[idx];
    if (!section) return;
    
    if (section.type === 'gallery') {
      const hasPlaceholderImages = !section.content_json.images || 
        section.content_json.images.length === 0 ||
        section.content_json.images.every(img => img.includes('unsplash.com') || img.includes('placeholder'));
      
      if (hasPlaceholderImages) {
        const matchingUrls = (generatedImages || [])
          .filter(img => {
            const promptLower = (img.prompt || '').toLowerCase();
            return promptLower.includes('[template: gallery') || promptLower.includes('gallery_');
          })
          .map(img => img.image_url);
        
        if (matchingUrls.length > 0) {
          updateSectionContent(idx, { images: matchingUrls });
        }
      }
    } else {
      const hasPlaceholder = !section.content_json.coverImage || 
        section.content_json.coverImage.includes('unsplash.com') ||
        section.content_json.coverImage.includes('placeholder');
      
      if (hasPlaceholder) {
        const matchingUrl = getMatchingImageForSection(section.type, generatedImages);
        if (matchingUrl) {
          updateSectionContent(idx, { coverImage: matchingUrl });
        }
      }
    }
  };

  // AI SEO State
  const [seoModal, setSeoModal] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [seoTopic, setSeoTopic] = useState('');
  const [generatingSeo, setGeneratingSeo] = useState(false);

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
      const errorMsg = result?.details 
        ? `${result.error}\n\nDetalles: ${result.details}` 
        : (result?.error || 'Error al publicar la página');
      alert(errorMsg);
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
    updateLandingMeta({
      seo_title: seoTitle,
      seo_description: seoDesc
    });
    setSeoModal(false);
  };

  // Handle local image file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadProjectAsset(selectedProject.id, file);
      // Switch to Fotos panel to see it
      setActiveLeftTab('fotos');
    } catch (err) {
      console.error('[Upload] Error uploading asset:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Image select handler
  const handleSelectAsset = (url) => {
    if (!activeImageSlot) {
      // Just copy to clipboard as feedback
      navigator.clipboard.writeText(url);
      alert('Enlace de la imagen copiado al portapapeles');
      return;
    }

    const { sectionIdx, field, imageIdx } = activeImageSlot;
    if (field === 'coverImage') {
      updateSectionContent(sectionIdx, { coverImage: url });
    } else if (field === 'images' && imageIdx !== undefined) {
      const section = sections[sectionIdx];
      const list = [...(section.content_json.images || [])];
      list[imageIdx] = url;
      updateSectionContent(sectionIdx, { images: list });
    }

    // Reset picker slot
    setActiveImageSlot(null);
  };

  // Move gallery image up/down
  const moveGalleryImage = (idx, direction) => {
    const activeSection = sections[activeSectionIdx];
    if (!activeSection || activeSection.type !== 'gallery') return;
    
    const list = [...(activeSection.content_json.images || [])];
    if (direction === 'up' && idx > 0) {
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
      updateSectionContent(activeSectionIdx, { images: list });
      
      if (activeImageSlot && activeImageSlot.sectionIdx === activeSectionIdx && activeImageSlot.field === 'images') {
        if (activeImageSlot.imageIdx === idx) {
          setActiveImageSlot({ ...activeImageSlot, imageIdx: idx - 1 });
        } else if (activeImageSlot.imageIdx === idx - 1) {
          setActiveImageSlot({ ...activeImageSlot, imageIdx: idx });
        }
      }
    } else if (direction === 'down' && idx < list.length - 1) {
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
      updateSectionContent(activeSectionIdx, { images: list });
      
      if (activeImageSlot && activeImageSlot.sectionIdx === activeSectionIdx && activeImageSlot.field === 'images') {
        if (activeImageSlot.imageIdx === idx) {
          setActiveImageSlot({ ...activeImageSlot, imageIdx: idx + 1 });
        } else if (activeImageSlot.imageIdx === idx + 1) {
          setActiveImageSlot({ ...activeImageSlot, imageIdx: idx });
        }
      }
    }
  };

  // Direct trigger save
  const handleManualSave = () => {
    useStore.getState().triggerAutosave();
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
      
      {/* 1. TOP BAR */}
      <header className="h-[65px] bg-slate-900 border-b border-white/5 px-6 flex items-center justify-between shrink-0 relative z-20">
        
        {/* Left Section: Back, Title, Autosave Status, Slug */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Volver</span>
          </button>

          <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>

          {/* Editable Title */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={selectedLanding.title}
                onChange={e => updateLandingMeta({ title: e.target.value })}
                className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-purple-500 focus:outline-none text-slate-200 font-bold text-sm px-1 py-0.5 transition-all max-w-[200px]"
                title="Haga clic para editar el título"
              />
              
              {/* Autosave Status Indicator */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                {saveStatus === 'saving' && (
                  <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" />
                )}
                {saveStatus === 'saved' && (
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                )}
                {saveStatus === 'error' && (
                  <X className="w-3 h-3 text-red-500" />
                )}
                <span className="text-[10px] hidden lg:inline capitalize">
                  {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? 'Guardado' : 'Error'}
                </span>
              </div>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>

          {/* Inline Slug Editor */}
          <div className="hidden md:flex items-center gap-1 text-slate-500 text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="font-mono text-slate-500 select-none">/slug/</span>
            <input
              type="text"
              value={selectedLanding.slug}
              onChange={e => updateLandingMeta({ slug: e.target.value })}
              className="bg-transparent text-slate-300 font-mono focus:outline-none max-w-[140px] focus:text-white"
            />
          </div>
        </div>

        {/* Center Section: Viewport Device Toggles, Lazy Load, Masking, Theme Toggles */}
        <div className="flex items-center gap-4">
          
          {/* Device Width Selectors */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <button 
              onClick={() => setPreviewMode('desktop')}
              className={`p-1.5 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Escritorio"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPreviewMode('tablet')}
              className={`p-1.5 rounded-lg transition-all ${previewMode === 'tablet' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Tablet"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPreviewMode('mobile')}
              className={`p-1.5 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Móvil"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle buttons for advanced settings (Lazy load, Masking, Workspace color theme) */}
          <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            
            {/* Lazy Load Toggle */}
            <button
              onClick={() => updateLandingMeta({ lazy_load: !selectedLanding.lazy_load })}
              className={`p-2 rounded-xl border transition-all ${
                selectedLanding.lazy_load !== false
                  ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
              title={`Lazy Load de imágenes: ${selectedLanding.lazy_load !== false ? 'Activo' : 'Inactivo'}`}
            >
              <Zap className="w-4 h-4" />
            </button>

            {/* Masking/Enmascarar Copy Protection Toggle */}
            <button
              onClick={() => updateLandingMeta({ masking: !selectedLanding.masking })}
              className={`p-2 rounded-xl border transition-all ${
                selectedLanding.masking
                  ? 'bg-purple-600/10 border-purple-500/30 text-purple-400' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
              title={`Enmascarar (Protección de copia): ${selectedLanding.masking ? 'Activo' : 'Inactivo'}`}
            >
              {selectedLanding.masking ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
            </button>

            {/* Workspace light/dark theme switch */}
            <button
              onClick={() => setWorkspaceTheme(workspaceTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border bg-white/5 border-white/10 text-slate-400 hover:text-white transition-all hidden sm:block"
              title="Cambiar fondo del lienzo (Claro/Oscuro)"
            >
              <span className="text-xs font-bold font-mono px-0.5">{workspaceTheme === 'dark' ? 'DARK' : 'LIGHT'}</span>
            </button>
          </div>
        </div>

        {/* Right Section: SEO, Guardar, Publicar */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSeoModal(true)}
            className="px-3 py-2 rounded-xl border border-purple-500/30 text-purple-300 text-xs font-semibold bg-purple-600/5 hover:bg-purple-600/15 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Asistente SEO</span>
          </button>

          <button 
            onClick={handleManualSave}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all"
          >
            Guardar
          </button>

          <button 
            onClick={handlePublish}
            disabled={publishing}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all shadow-lg shadow-purple-500/25 flex items-center gap-1.5 disabled:opacity-50"
          >
            {publishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudLightning className="w-3.5 h-3.5" />}
            <span>Publicar</span>
          </button>
        </div>
      </header>

      {/* 2. LOWER EDITOR WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT BAR ICONS PANEL (Width 70px) */}
        <div className="w-[70px] bg-slate-950 border-r border-white/5 flex flex-col items-center py-4 justify-between shrink-0 z-20">
          <div className="flex flex-col items-center gap-4 w-full">
            
            {/* Sections tab button */}
            <button
              onClick={() => {
                if (activeLeftTab === 'secciones' && isLeftPanelOpen) {
                  setIsLeftPanelOpen(false);
                } else {
                  setActiveLeftTab('secciones');
                  setIsLeftPanelOpen(true);
                }
              }}
              className={`p-3 rounded-2xl transition-all relative group ${
                isLeftPanelOpen && activeLeftTab === 'secciones'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title="Secciones y Bloques"
            >
              <Layers className="w-5 h-5" />
              <span className="absolute left-[80px] bg-slate-900 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap shadow-xl">Secciones</span>
            </button>

            {/* Photos tab button */}
            <button
              onClick={() => {
                if (activeLeftTab === 'fotos' && isLeftPanelOpen) {
                  setIsLeftPanelOpen(false);
                } else {
                  setActiveLeftTab('fotos');
                  setIsLeftPanelOpen(true);
                }
              }}
              className={`p-3 rounded-2xl transition-all relative group ${
                isLeftPanelOpen && activeLeftTab === 'fotos'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title="Fotos y Assets comerciales"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="absolute left-[80px] bg-slate-900 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap shadow-xl">Fotos del Proyecto</span>
            </button>

            {/* Botones/Custom Buttons tab button */}
            <button
              onClick={() => {
                if (activeLeftTab === 'botones' && isLeftPanelOpen) {
                  setIsLeftPanelOpen(false);
                } else {
                  setActiveLeftTab('botones');
                  setIsLeftPanelOpen(true);
                }
              }}
              className={`p-3 rounded-2xl transition-all relative group ${
                isLeftPanelOpen && activeLeftTab === 'botones'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title="Botones WhatsApp & CTA flotante"
            >
              <MousePointer className="w-5 h-5" />
              <span className="absolute left-[80px] bg-slate-900 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap shadow-xl">Botones Flotantes</span>
            </button>

            {/* Upload Files tab button */}
            <button
              onClick={() => {
                if (activeLeftTab === 'subidos' && isLeftPanelOpen) {
                  setIsLeftPanelOpen(false);
                } else {
                  setActiveLeftTab('subidos');
                  setIsLeftPanelOpen(true);
                }
              }}
              className={`p-3 rounded-2xl transition-all relative group ${
                isLeftPanelOpen && activeLeftTab === 'subidos'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title="Subir archivos locales"
            >
              <Upload className="w-5 h-5" />
              <span className="absolute left-[80px] bg-slate-900 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap shadow-xl">Subir Imagen</span>
            </button>

            {/* Layers tab button */}
            <button
              onClick={() => {
                if (activeLeftTab === 'capas' && isLeftPanelOpen) {
                  setIsLeftPanelOpen(false);
                } else {
                  setActiveLeftTab('capas');
                  setIsLeftPanelOpen(true);
                }
              }}
              className={`p-3 rounded-2xl transition-all relative group ${
                isLeftPanelOpen && activeLeftTab === 'capas'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title="Árbol de componentes / Capas"
            >
              <FolderTree className="w-5 h-5" />
              <span className="absolute left-[80px] bg-slate-900 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap shadow-xl">Capas Visuales</span>
            </button>

            {/* CSS tab button */}
            <button
              onClick={() => {
                if (activeLeftTab === 'css' && isLeftPanelOpen) {
                  setIsLeftPanelOpen(false);
                } else {
                  setActiveLeftTab('css');
                  setIsLeftPanelOpen(true);
                }
              }}
              className={`p-3 rounded-2xl transition-all relative group ${
                isLeftPanelOpen && activeLeftTab === 'css'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              title="Estilo CSS Personalizado"
            >
              <Code className="w-5 h-5" />
              <span className="absolute left-[80px] bg-slate-900 border border-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap shadow-xl">CSS Personalizado</span>
            </button>

          </div>
          
          <div className="text-[10px] font-bold text-slate-600 select-none uppercase font-mono tracking-widest">
            SAAS
          </div>
        </div>

        {/* LEFT COLLAPSIBLE CONTENT SUB-PANEL (Width 320px) */}
        {isLeftPanelOpen && (
          <aside className="w-80 bg-slate-900 border-r border-white/5 flex flex-col shrink-0 relative z-10">
            
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 capitalize">
                {activeLeftTab === 'css' ? 'CSS Personalizado' : activeLeftTab === 'fotos' ? 'Imagenes' : activeLeftTab}
              </h3>
              <button 
                onClick={() => setIsLeftPanelOpen(false)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5">
              
              {/* Image picking indicator warning banner */}
              {activeImageSlot && (activeLeftTab === 'fotos' || activeLeftTab === 'subidos') && (
                <div className="p-3 mb-4 rounded-xl bg-purple-600/10 border border-purple-500/30 text-xs text-purple-300 animate-pulse">
                  Modo de selección activo: Haz clic en una imagen a continuación para aplicarla a la sección.
                </div>
              )}

              {/* 1. SECCIONES SUB-PANEL */}
              {activeLeftTab === 'secciones' && (
                <div className="space-y-6">
                  
                  {/* Current Active Sections tree list */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Bloques en tu página</span>
                    {sections.length === 0 ? (
                      <p className="text-xs text-slate-500">Aún no hay bloques en esta página.</p>
                    ) : (
                      <div className="space-y-2">
                        {sections.map((sec, idx) => (
                          <div 
                            key={idx}
                            onClick={() => selectAndAutoPullSection(idx)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                              activeSectionIdx === idx 
                                ? 'bg-purple-600/10 border-purple-500/40 text-purple-200 shadow-md' 
                                : 'bg-white/[0.01] border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className="text-xs font-semibold capitalize font-mono">{idx + 1}. {getSectionTypeNameSpanish(sec.type)}</span>
                            
                            {/* Ordering / Deleting Buttons */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); if (idx > 0) reorderSections(idx, idx - 1); }}
                                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                                title="Subir"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); if (idx < sections.length - 1) reorderSections(idx, idx + 1); }}
                                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                                title="Bajar"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeSection(idx); }}
                                className="p-1 rounded hover:bg-red-500/20 text-red-400"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="h-[1px] w-full bg-white/5"></div>

                  {/* Add sections controls */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Agregar Nuevo Bloque</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {['hero', 'benefits', 'offer', 'reviews', 'faq', 'gallery', 'comparison', 'cta'].map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            addSection(type);
                            const newIdx = sections.length;
                            setTimeout(() => selectAndAutoPullSection(newIdx), 150);
                          }}
                          className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all text-left text-xs text-slate-300 hover:text-white font-medium flex items-center justify-between"
                        >
                          <span>{getSectionTypeNameSpanish(type)}</span>
                          <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* 2. FOTOS SUB-PANEL */}
              {activeLeftTab === 'fotos' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Card 1: Imagen */}
                    <button
                      onClick={() => addSection('hero', {
                        title: '',
                        subtitle: '',
                        ctaText: '',
                        coverImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
                        badge: '',
                        theme: 'light'
                      })}
                      className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all text-center group cursor-pointer aspect-square"
                    >
                      <span className="text-3xl mb-2 filter drop-shadow-md group-hover:scale-110 transition-transform">🖼️</span>
                      <span className="text-xs font-bold text-slate-200">Imagen</span>
                      <span className="text-[10px] text-slate-500 mt-1">Foto full width</span>
                    </button>

                    {/* Card 2: Imagen + Boton */}
                    <button
                      onClick={() => addSection('cta', {
                        title: '',
                        subtitle: '',
                        buttonText: 'COMPRAR AHORA',
                        buttonLink: '#offer',
                        coverImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800'
                      })}
                      className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all text-center group cursor-pointer aspect-square"
                    >
                      <span className="text-3xl mb-2 filter drop-shadow-md group-hover:scale-110 transition-transform">📷</span>
                      <span className="text-xs font-bold text-slate-200">Imagen + Boton</span>
                      <span className="text-[10px] text-slate-500 mt-1">Foto con CTA abajo</span>
                    </button>

                    {/* Card 3: Franja Color */}
                    <button
                      onClick={() => addSection('comparison', {
                        text: '🔥 OFERTA DE LANZAMIENTO: 50% DE DESCUENTO + ENVÍO GRATIS HOY 🔥',
                        bgColor: '#9333ea',
                        textColor: '#ffffff'
                      })}
                      className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all text-center group cursor-pointer aspect-square"
                    >
                      <span className="text-3xl mb-2 filter drop-shadow-md group-hover:scale-110 transition-transform">🎨</span>
                      <span className="text-xs font-bold text-slate-200">Franja Color</span>
                      <span className="text-[10px] text-slate-500 mt-1">Texto sobre color</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. BOTONES CONFIG SUB-PANEL */}
              {activeLeftTab === 'botones' && (
                <div className="space-y-6">
                  
                  {/* WhatsApp button settings */}
                  <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-200">Botón de WhatsApp</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={selectedLanding.whatsapp_active !== false}
                        onChange={e => updateLandingMeta({ whatsapp_active: e.target.checked })}
                        className="rounded bg-slate-950 border-white/10 text-purple-600 focus:ring-purple-600/30 w-4 h-4 cursor-pointer"
                      />
                    </div>

                    {selectedLanding.whatsapp_active !== false && (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Teléfono (con prefijo país)</label>
                          <input 
                            type="text" 
                            className="glass-input text-xs" 
                            placeholder="Ej: 573242035307"
                            value={selectedLanding.whatsapp_phone || ''}
                            onChange={e => updateLandingMeta({ whatsapp_phone: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Mensaje preestablecido</label>
                          <textarea 
                            className="glass-input text-xs resize-none" 
                            rows="3"
                            placeholder="Ej: Hola, quiero información sobre este producto."
                            value={selectedLanding.whatsapp_text || ''}
                            onChange={e => updateLandingMeta({ whatsapp_text: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Floating CTA bar settings */}
                  <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-200">Barra de Compra Flotante</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={selectedLanding.floating_cta_active !== false}
                        onChange={e => updateLandingMeta({ floating_cta_active: e.target.checked })}
                        className="rounded bg-slate-950 border-white/10 text-purple-600 focus:ring-purple-600/30 w-4 h-4 cursor-pointer"
                      />
                    </div>

                    {selectedLanding.floating_cta_active !== false && (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Texto del botón flotante</label>
                          <input 
                            type="text" 
                            className="glass-input text-xs" 
                            placeholder="Ej: ¡PEDIR CON DESCUENTO!"
                            value={selectedLanding.floating_cta_text || ''}
                            onChange={e => updateLandingMeta({ floating_cta_text: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* 4. SUBIDOS SUB-PANEL */}
              {activeLeftTab === 'subidos' && (
                <div className="space-y-5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Subir archivos locales</span>
                  
                  {/* File Upload drag area */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border border-dashed border-white/10 hover:border-purple-500/40 rounded-2xl bg-white/[0.005] hover:bg-purple-600/[0.02] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center min-h-[140px]"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                    />
                    
                    {isUploading ? (
                      <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-600 stroke-1" />
                    )}
                    
                    <div>
                      <p className="text-xs font-semibold text-slate-300">
                        {isUploading ? 'Subiendo archivo...' : 'Selecciona una foto'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">Soporta PNG, JPG, WEBP de hasta 5MB</p>
                    </div>
                  </div>

                  {/* Gallery of all Project Images */}
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Galería del Proyecto</span>
                    {generatedImages.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No hay imágenes en este proyecto.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {generatedImages.map(img => (
                          <div 
                            key={img.id}
                            onClick={() => handleSelectAsset(img.image_url)}
                            className={`aspect-square rounded-lg overflow-hidden border bg-slate-950 cursor-pointer relative group transition-all ${
                              activeImageSlot ? 'border-purple-500 scale-102' : 'border-white/10 hover:border-white/20'
                            }`}
                            title={activeImageSlot ? 'Haga clic para aplicar esta imagen' : 'Haga clic para copiar el enlace'}
                          >
                            <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              {activeImageSlot ? (
                                <CheckCircle className="w-4 h-4 text-purple-400" />
                              ) : (
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(img.image_url); alert('Enlace de la imagen copiado'); }}
                                    className="p-1 rounded bg-slate-900 border border-white/15 text-slate-300 hover:text-white"
                                    title="Copiar enlace"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar esta imagen de los assets?')) deleteProjectImage(img.id); }}
                                    className="p-1 rounded bg-red-950/80 border border-red-900/30 text-red-400 hover:text-red-300"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* 5. CAPAS SUB-PANEL */}
              {activeLeftTab === 'capas' && (
                <div className="space-y-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Componentes visuales</span>
                  
                  <div className="space-y-1.5">
                    {sections.length === 0 ? (
                      <p className="text-xs text-slate-500">No hay capas en esta página.</p>
                    ) : (
                      sections.map((sec, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectAndAutoPullSection(idx)}
                          className={`p-3 rounded-xl text-xs font-mono flex items-center justify-between cursor-pointer border transition-all ${
                            activeSectionIdx === idx
                              ? 'bg-purple-600/15 border-purple-500/30 text-purple-200 shadow-md'
                              : 'bg-white/[0.005] border-white/5 hover:bg-white/[0.02] text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600">#{idx + 1}</span>
                            <span>{getSectionTypeNameSpanish(sec.type)}</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-white/5 text-slate-500 uppercase font-mono">{getSectionTypeNameSpanish(sec.type)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 6. CSS SUB-PANEL */}
              {activeLeftTab === 'css' && (
                <div className="space-y-4 h-full flex flex-col">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Hojas de estilo personalizadas</span>
                  
                  <textarea
                    className="w-full h-[55vh] bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500 resize-none flex-1"
                    value={selectedLanding.custom_css || ''}
                    onChange={e => updateLandingMeta({ custom_css: e.target.value })}
                    placeholder="/* Agrega tus reglas CSS aquí */&#10;&#10;body {&#10;  background-color: #f3f4f6;&#10;}&#10;&#10;.ms-mobile-preview {&#10;  border-radius: 12px;&#10;}"
                    title="Editor CSS"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Las reglas CSS agregadas aquí se inyectarán en la sección head del HTML publicado y se aplicarán al lienzo en tiempo real.
                  </p>
                </div>
              )}

            </div>
          </aside>
        )}

        {/* CENTER PANEL: Device Frame & Preview Canvas */}
        <section className="flex-1 bg-slate-950/20 p-8 flex items-center justify-center overflow-y-auto relative">
          
          {/* Dynamic Style injection for custom CSS rules inside the workspace editor */}
          {selectedLanding.custom_css && (
            <style dangerouslySetInnerHTML={{ __html: selectedLanding.custom_css }} />
          )}

          {/* Device Frame */}
          <div 
            className="transition-all duration-300 shadow-2xl relative bg-slate-950 border border-white/5 min-h-[70vh] rounded-2xl overflow-y-auto flex flex-col"
            style={{
              width: previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '768px' : '100%',
              maxHeight: '100%'
            }}
          >
            {sections.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center flex-grow min-h-[50vh]">
                <Plus className="w-12 h-12 stroke-1 animate-pulse text-purple-400" />
                <p className="text-sm mt-4 font-semibold text-slate-400">Tu Landing Page está vacía</p>
                <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                  Comienza agregando secciones desde el menú de la izquierda haciendo clic en el botón '+' de la sección o seleccionando tipos de bloques.
                </p>
              </div>
            ) : (
              <div 
                className={`transition-all duration-300 w-full flex-grow relative ${
                  workspaceTheme === 'light' ? 'bg-slate-100' : 'bg-slate-900/60'
                } ${
                  previewMode === 'desktop' ? 'py-8 px-4 flex justify-center min-h-[70vh]' : 'min-h-[70vh]'
                }`}
              >
                {/* Simulated published mobile view bounds inside desktop viewport */}
                <div 
                  className={`w-full divide-y divide-slate-100 bg-white pointer-events-none relative pb-24 shadow-xl border border-slate-200/50 ${
                    previewMode === 'desktop' ? 'max-w-[480px] rounded-2xl overflow-hidden' : ''
                  } ${
                    selectedLanding.masking ? 'select-none' : ''
                  }`}
                >
                  {sections.map((sec, idx) => (
                    <div 
                      key={idx} 
                      onClick={(e) => { e.stopPropagation(); selectAndAutoPullSection(idx); }}
                      draggable={true}
                      onDragStart={(e) => {
                        setDraggedIdx(idx);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', idx);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverIdx !== idx) {
                          setDragOverIdx(idx);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverIdx === idx) {
                          setDragOverIdx(null);
                        }
                      }}
                      onDragEnd={() => {
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIdx !== null && draggedIdx !== idx) {
                          reorderSections(draggedIdx, idx);
                        }
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }}
                      className={`relative group border-2 transition-all pointer-events-auto cursor-grab active:cursor-grabbing ${
                        draggedIdx === idx 
                          ? 'opacity-30 scale-95 border-purple-500/30' 
                          : dragOverIdx === idx 
                            ? 'border-dashed border-purple-500 bg-purple-500/[0.03] scale-[1.01] shadow-xl z-20' 
                            : activeSectionIdx === idx 
                              ? 'border-emerald-500 z-10' 
                              : 'border-transparent hover:border-purple-500/40'
                      }`}
                    >
                      {/* Floating Section Toolbar */}
                      <div className={`absolute top-2 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur border border-white/10 rounded-full px-2 py-1 flex items-center gap-1 shadow-lg transition-all duration-200 z-30 pointer-events-auto ${
                        activeSectionIdx === idx ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-95 pointer-events-none group-hover:pointer-events-auto'
                      }`}>
                        {/* Subir */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (idx > 0) reorderSections(idx, idx - 1);
                          }}
                          className={`p-1.5 rounded-full flex items-center justify-center transition-all ${
                            idx === 0 
                              ? 'text-slate-600 cursor-not-allowed' 
                              : 'text-slate-300 hover:text-white hover:bg-white/10 active:scale-90'
                          }`}
                          title="Subir bloque"
                        >
                          <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                        </button>

                        {/* Bajar */}
                        <button
                          type="button"
                          disabled={idx === sections.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (idx < sections.length - 1) reorderSections(idx, idx + 1);
                          }}
                          className={`p-1.5 rounded-full flex items-center justify-center transition-all ${
                            idx === sections.length - 1 
                              ? 'text-slate-600 cursor-not-allowed' 
                              : 'text-slate-300 hover:text-white hover:bg-white/10 active:scale-90'
                          }`}
                          title="Bajar bloque"
                        >
                          <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                        </button>

                        <div className="w-[1px] h-3.5 bg-white/10 mx-0.5"></div>

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('¿Estás seguro de que deseas eliminar este bloque de la página?')) {
                              removeSection(idx);
                            }
                          }}
                          className="p-1.5 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 active:scale-90 flex items-center justify-center transition-all"
                          title="Eliminar bloque"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Section tag badge */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-[8px] font-mono text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                        {getSectionTypeNameSpanish(sec.type)}
                      </span>

                      {/* Render visual layouts based on type */}
                      {sec.type === 'hero' && (
                        sec.content_json.coverImage && !sec.content_json.title && !sec.content_json.subtitle ? (
                          <div className="relative bg-white overflow-hidden">
                            <img src={sec.content_json.coverImage} alt="Hero Banner" className="w-full h-auto block" />
                          </div>
                        ) : (
                          <div 
                            className="py-16 px-6 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[280px]"
                            style={{
                              backgroundImage: sec.content_json.coverImage ? `linear-gradient(to bottom, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.95)), url(${sec.content_json.coverImage})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <div className="max-w-md mx-auto space-y-3 relative z-10 text-slate-900">
                              {sec.content_json.badge && (
                                <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full inline-block">
                                  {sec.content_json.badge}
                                </span>
                              )}
                              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{sec.content_json.title || 'Título del Producto'}</h1>
                              {sec.content_json.subtitle && <p className="text-xs text-slate-500 max-w-sm mx-auto">{sec.content_json.subtitle}</p>}
                              {sec.content_json.ctaText && (
                                <button className="px-6 py-3 rounded-xl bg-emerald-500 text-xs font-bold text-white mt-2 shadow-lg shadow-emerald-500/25 inline-block anim-shake">
                                  {sec.content_json.ctaText}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      )}
                      
                      {sec.type === 'benefits' && (
                        <div className="py-12 px-6 bg-slate-50 text-slate-900 border-b border-slate-100">
                          <h2 className="text-lg font-black text-center text-slate-900 mb-6">{sec.content_json.title || 'Beneficios Exclusivos'}</h2>
                          <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                            {(sec.content_json.items || []).map((item, i) => (
                              <div key={i} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="font-bold text-xs text-slate-900">{item.title || 'Beneficio'}</h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{item.description || 'Detalle del beneficio.'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {sec.type === 'offer' && (
                        <div className="py-12 px-6 bg-white text-slate-800 animate-pulse-slow">
                          <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-lg text-center">
                            {sec.content_json.badge && (
                              <span className="px-2.5 py-1 rounded-full text-[9px] bg-emerald-500 text-white font-black uppercase tracking-wider inline-block mb-3 animate-pulse">{sec.content_json.badge}</span>
                            )}
                            <h3 className="font-bold text-base text-slate-900">{sec.content_json.title || '¡Oferta Especial!'}</h3>
                            <div className="my-3 flex flex-col items-center gap-1">
                              <span className="line-through text-xs text-slate-400">Antes ${sec.content_json.originalPrice || '149.900'}</span>
                              <div className="flex items-baseline justify-center">
                                <span className="text-3xl font-black text-emerald-600">${sec.content_json.price || '89.900'}</span>
                                <span className="text-slate-500 text-[10px] ml-1.5 font-bold">COP / Envío Gratis</span>
                              </div>
                            </div>
                            <button className="px-6 py-3 bg-emerald-500 text-xs font-black rounded-xl text-white w-full shadow-md shadow-emerald-500/20 transform active:scale-95 transition-all anim-shake">
                              {sec.content_json.buttonText || 'PEDIR CON DESCUENTO'}
                            </button>
                            {sec.content_json.features && (
                              <div className="mt-4 text-left border-t border-slate-200/60 pt-3">
                                <ul className="space-y-1.5">
                                  {(sec.content_json.features || []).map((f, i) => (
                                    <li key={i} className="flex items-center text-slate-600 text-[10px] font-medium">
                                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-2 shrink-0">
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
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
                        <div className="py-12 px-6 bg-slate-50 text-slate-900 border-b border-slate-100">
                          <h3 className="font-bold text-center mb-6 text-sm uppercase tracking-wider text-slate-400">{sec.content_json.title || 'Preguntas Frecuentes'}</h3>
                          <div className="space-y-3 max-w-md mx-auto">
                            {(sec.content_json.questions || []).map((q, i) => (
                              <div key={i} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm text-left">
                                <h5 className="text-xs font-bold text-slate-900 flex items-start">
                                  <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded mr-2 shrink-0 font-black">Q</span>
                                  {q.q}
                                </h5>
                                <p className="text-[11px] text-slate-500 mt-1.5 pl-6 leading-relaxed">{q.a}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sec.type === 'reviews' && (
                        <div className="py-12 px-6 bg-slate-50 border-b border-slate-100">
                          <h3 className="font-bold text-center mb-6 text-slate-900">{sec.content_json.title || 'Lo Que Opinan Nuestros Clientes'}</h3>
                          <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                            {(sec.content_json.reviews || []).map((r, i) => (
                              <div key={i} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
                                <div className="mb-2">
                                  <div className="flex text-amber-400 mb-2 text-xs">
                                    {Array(r.rating || 5).fill('').map((_, idx) => (
                                      <span key={idx}>★</span>
                                    ))}
                                  </div>
                                  <p className="text-xs italic text-slate-600">"{r.comment}"</p>
                                </div>
                                <div className="flex items-center gap-2 border-t border-slate-100 pt-2 mt-1">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[9px] uppercase">
                                    {r.name ? r.name.charAt(0) : 'U'}
                                  </div>
                                  <div>
                                    <h5 className="text-slate-900 font-bold text-[10px] flex items-center gap-1">
                                      <span>{r.name}</span>
                                      <span className="text-[7px] bg-green-100 text-green-700 px-1.5 py-0.2 rounded-full font-bold">Verificado</span>
                                    </h5>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sec.type === 'gallery' && (
                        <div className="py-0 bg-white border-b border-slate-100">
                          <div className="grid grid-cols-1 gap-0 max-w-md mx-auto">
                            {(sec.content_json.images || []).map((img, i) => 
                              img ? (
                                <div key={i} className="bg-white overflow-hidden">
                                  <img src={img} alt="" className="w-full h-auto block" />
                                </div>
                              ) : (
                                <div key={i} className="p-6 border border-dashed border-slate-200 m-2 rounded-xl flex items-center justify-center text-slate-400 bg-slate-50 text-xs">
                                  <ImageIcon className="w-5 h-5 mr-1" />
                                  <span>Slot de imagen vacío ({i + 1})</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {sec.type === 'cta' && (
                        <div className="py-12 px-6 bg-white text-center border-b border-slate-100">
                          <div className="max-w-md mx-auto space-y-4">
                            {sec.content_json.coverImage ? (
                              <div className="relative rounded-2xl overflow-hidden shadow-md">
                                <img src={sec.content_json.coverImage} alt="CTA Banner" className="w-full h-auto block" />
                              </div>
                            ) : (
                              <div className="p-12 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 bg-slate-50 text-xs">
                                <ImageIcon className="w-5 h-5 mr-1" />
                                <span>Slot de imagen vacío</span>
                              </div>
                            )}
                            {sec.content_json.title && <h3 className="text-xl font-bold text-slate-900 leading-tight">{sec.content_json.title}</h3>}
                            {sec.content_json.subtitle && <p className="text-xs text-slate-500 max-w-sm mx-auto">{sec.content_json.subtitle}</p>}
                            <div className="flex justify-center">
                              <button className="px-8 py-3.5 text-xs font-black rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 anim-shake">
                                {sec.content_json.buttonText || 'COMPRAR AHORA'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {sec.type === 'comparison' && (
                        <div 
                          className="py-3 px-6 text-center font-extrabold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center min-h-[40px] border-b border-black/10 select-none shadow-[inset_0_-2px_6px_rgba(0,0,0,0.05)]"
                          style={{
                            backgroundColor: sec.content_json.bgColor || '#9333ea',
                            color: sec.content_json.textColor || '#ffffff'
                          }}
                        >
                          <span>{sec.content_json.text || 'Texto de la franja'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Floating CTA simulation inside the canvas container */}
                  {(selectedLanding.floating_cta_active !== false) && (
                    <div className="absolute bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur border-t border-slate-100 flex items-center justify-center z-20 shadow-[0_-4px_15px_rgba(0,0,0,0.04)]">
                      <button className="w-full text-center py-2.5 rounded-xl bg-emerald-500 text-white font-extrabold text-xs tracking-wide shadow-md shadow-emerald-500/10">
                        {selectedLanding.floating_cta_text || '¡PEDIR CON DESCUENTO!'}
                      </button>
                    </div>
                  )}

                  {/* Floating WhatsApp simulation inside the canvas container */}
                  {(selectedLanding.whatsapp_active !== false) && (
                    <div className="absolute bottom-16 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-green-500 shadow-lg text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-5 w-5 fill-white">
                        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.742 3.052 9.376L1.054 31.28l6.156-1.968C9.758 30.98 12.762 32 16.004 32 24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.35 22.606c-.392 1.106-1.94 2.024-3.186 2.292-.854.182-1.968.326-5.72-1.23-4.802-1.99-7.892-6.86-8.132-7.178-.23-.318-1.938-2.58-1.938-4.922 0-2.342 1.228-3.494 1.664-3.972.392-.43 1.034-.612 1.648-.612.198 0 .376.01.536.018.478.02.716.048 1.032.796.392.934 1.348 3.276 1.466 3.514.12.238.24.556.08.874-.148.326-.278.47-.516.742-.238.272-.464.48-.702.772-.216.256-.46.53-.196.99.264.452 1.174 1.934 2.52 3.134 1.734 1.544 3.194 2.024 3.648 2.248.354.178.776.138 1.052-.158.348-.376.778-.998 1.216-1.612.31-.438.702-.494 1.094-.334.398.152 2.526 1.19 2.958 1.408.432.218.72.326.826.508.104.182.104 1.062-.288 2.168z"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
 
        {/* RIGHT PANEL: Content Settings Editor */}
        <aside className="w-80 bg-slate-950 border-l border-white/5 flex flex-col justify-between overflow-y-auto shrink-0 relative z-10 p-5">
          {activeSectionIdx === null ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-600">
              <Sliders className="w-10 h-10 mb-3 stroke-1 text-slate-700" />
              <p className="text-xs">Selecciona un bloque en la estructura (izquierda) o en el lienzo (centro) para editar sus propiedades.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <h4 className="font-bold text-sm capitalize text-slate-200">Ajustes: {getSectionTypeNameSpanish(sections[activeSectionIdx].type)}</h4>
                <button 
                  onClick={() => setActiveSectionIdx(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cerrar
                </button>
              </div>

              {/* DYNAMIC FORM COMPONENT INPUTS BY SECTION TYPE */}
              {sections[activeSectionIdx].type === 'hero' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Título Principal</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.title || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { title: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Subtítulo</label>
                    <textarea 
                      className="glass-input text-xs resize-none" 
                      rows="3"
                      value={sections[activeSectionIdx].content_json.subtitle || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { subtitle: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Texto del Botón</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.ctaText || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { ctaText: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Destino Link</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.ctaLink || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { ctaLink: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                    <label className="text-xs text-slate-400 font-semibold flex items-center justify-between">
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
                      onClick={() => {
                        setActiveImageSlot({ sectionIdx: activeSectionIdx, field: 'coverImage' });
                        setActiveLeftTab('fotos');
                        setIsLeftPanelOpen(true);
                      }}
                      className={`p-3 bg-white/[0.01] border rounded-xl flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all ${
                        activeImageSlot && activeImageSlot.sectionIdx === activeSectionIdx && activeImageSlot.field === 'coverImage'
                          ? 'border-purple-500 animate-pulse'
                          : 'border-white/5'
                      }`}
                    >
                      <span className="text-xs text-slate-500">
                        {activeImageSlot && activeImageSlot.sectionIdx === activeSectionIdx && activeImageSlot.field === 'coverImage'
                          ? 'Esperando selección...'
                          : 'Cambiar Imagen'}
                      </span>
                      {sections[activeSectionIdx].content_json.coverImage ? (
                        <img 
                          src={sections[activeSectionIdx].content_json.coverImage} 
                          alt="Hero Cover" 
                          className="w-10 h-10 object-cover rounded-lg border border-white/10" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-slate-600">
                          +
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {sections[activeSectionIdx].type === 'benefits' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Título del Bloque</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.title || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { title: e.target.value })}
                    />
                  </div>
                  
                  {/* Mapping benefits items */}
                  <div className="space-y-3 border-t border-white/5 pt-3">
                    <span className="text-xs font-semibold text-slate-400">Items de beneficios</span>
                    {(sections[activeSectionIdx].content_json.items || []).map((item, idx) => (
                      <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2">
                        <input 
                          type="text" 
                          placeholder="Título del Item"
                          className="glass-input w-full text-xs"
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
                          className="glass-input w-full text-xs"
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
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Título de Oferta</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.title || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Precio Oferta ($)</label>
                      <input 
                        type="text" 
                        className="glass-input text-xs" 
                        value={sections[activeSectionIdx].content_json.price || ''}
                        onChange={e => updateSectionContent(activeSectionIdx, { price: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Precio Original ($)</label>
                      <input 
                        type="text" 
                        className="glass-input text-xs" 
                        value={sections[activeSectionIdx].content_json.originalPrice || ''}
                        onChange={e => updateSectionContent(activeSectionIdx, { originalPrice: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Badge de Descuento</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.badge || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { badge: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Texto del Botón</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.buttonText || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { buttonText: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {sections[activeSectionIdx].type === 'gallery' && (
                <div className="space-y-4">
                  {/* Mapping gallery items */}
                  <div className="space-y-3 border-t border-white/5 pt-3">
                    <span className="text-xs font-semibold text-slate-400">Imágenes (Haz clic para cambiar)</span>
                    
                    {(sections[activeSectionIdx].content_json.images || []).map((img, idx) => (
                      <div 
                        key={idx}
                        onClick={() => {
                          setActiveImageSlot({ sectionIdx: activeSectionIdx, field: 'images', imageIdx: idx });
                          setActiveLeftTab('fotos');
                          setIsLeftPanelOpen(true);
                        }}
                        className={`p-3 bg-white/[0.01] border rounded-xl flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all ${
                          activeImageSlot && activeImageSlot.sectionIdx === activeSectionIdx && activeImageSlot.field === 'images' && activeImageSlot.imageIdx === idx
                            ? 'border-purple-500 animate-pulse'
                            : 'border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Reordering buttons */}
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveGalleryImage(idx, 'up');
                              }}
                              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-25 disabled:hover:bg-transparent"
                              title="Subir"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === (sections[activeSectionIdx].content_json.images || []).length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                moveGalleryImage(idx, 'down');
                              }}
                              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-25 disabled:hover:bg-transparent"
                              title="Bajar"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-slate-200">Imagen {idx + 1}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const list = [...(sections[activeSectionIdx].content_json.images || [])];
                                list.splice(idx, 1);
                                updateSectionContent(activeSectionIdx, { images: list });
                                if (activeImageSlot && activeImageSlot.sectionIdx === activeSectionIdx && activeImageSlot.field === 'images' && activeImageSlot.imageIdx === idx) {
                                  setActiveImageSlot(null);
                                }
                              }}
                              className="text-[10px] text-red-500 hover:text-red-400 font-bold flex items-center gap-1 mt-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                        
                        {img ? (
                          <img src={img} alt="Thumb" className="w-12 h-12 object-cover rounded-lg border border-white/10 shadow-inner shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-slate-400 shrink-0">
                            <Plus className="w-4 h-4" />
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

              {sections[activeSectionIdx].type === 'cta' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Título del Bloque (Opcional)</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.title || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { title: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Subtítulo (Opcional)</label>
                    <textarea 
                      className="glass-input text-xs resize-none" 
                      rows="2"
                      value={sections[activeSectionIdx].content_json.subtitle || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { subtitle: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Texto del Botón</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.buttonText || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { buttonText: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Enlace o Ancla del Botón</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.buttonLink || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { buttonLink: e.target.value })}
                    />
                  </div>
                  
                  {/* Cover Image select container */}
                  <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
                    <label className="text-xs text-slate-400 font-semibold flex items-center justify-between">
                      <span>Imagen del Banner</span>
                    </label>
                    
                    <div 
                      onClick={() => {
                        setActiveImageSlot({ sectionIdx: activeSectionIdx, field: 'coverImage' });
                        setActiveLeftTab('subidos'); // Switch to subidos tab where gallery is!
                        setIsLeftPanelOpen(true);
                      }}
                      className={`p-3 bg-white/[0.01] border rounded-xl flex items-center justify-between hover:bg-white/5 cursor-pointer transition-all ${
                        activeImageSlot && activeImageSlot.sectionIdx === activeSectionIdx && activeImageSlot.field === 'coverImage'
                          ? 'border-purple-500 animate-pulse'
                          : 'border-white/5'
                      }`}
                    >
                      <span className="text-xs text-slate-500">
                        {activeImageSlot && activeImageSlot.sectionIdx === activeSectionIdx && activeImageSlot.field === 'coverImage'
                          ? 'Esperando selección...'
                           : 'Cambiar Imagen'}
                      </span>
                      {sections[activeSectionIdx].content_json.coverImage ? (
                        <img 
                          src={sections[activeSectionIdx].content_json.coverImage} 
                          alt="CTA Banner" 
                          className="w-10 h-10 object-cover rounded-lg border border-white/10" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-slate-600">
                          +
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {sections[activeSectionIdx].type === 'comparison' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Texto de la Franja</label>
                    <textarea 
                      className="glass-input text-xs resize-none" 
                      rows="3"
                      value={sections[activeSectionIdx].content_json.text || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { text: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Color de Fondo</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer p-0 shrink-0" 
                          value={sections[activeSectionIdx].content_json.bgColor || '#9333ea'}
                          onChange={e => updateSectionContent(activeSectionIdx, { bgColor: e.target.value })}
                        />
                        <input 
                          type="text" 
                          className="glass-input text-xs w-full font-mono uppercase" 
                          value={sections[activeSectionIdx].content_json.bgColor || '#9333ea'}
                          onChange={e => updateSectionContent(activeSectionIdx, { bgColor: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Color de Texto</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer p-0 shrink-0" 
                          value={sections[activeSectionIdx].content_json.textColor || '#ffffff'}
                          onChange={e => updateSectionContent(activeSectionIdx, { textColor: e.target.value })}
                        />
                        <input 
                          type="text" 
                          className="glass-input text-xs w-full font-mono uppercase" 
                          value={sections[activeSectionIdx].content_json.textColor || '#ffffff'}
                          onChange={e => updateSectionContent(activeSectionIdx, { textColor: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {sections[activeSectionIdx].type === 'faq' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Título del FAQ</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.title || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { title: e.target.value })}
                    />
                  </div>

                  {/* Questions list */}
                  <div className="space-y-3 border-t border-white/5 pt-3">
                    <span className="text-xs font-semibold text-slate-400">Preguntas & Respuestas</span>
                    
                    {(sections[activeSectionIdx].content_json.questions || []).map((item, idx) => (
                      <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...sections[activeSectionIdx].content_json.questions];
                            list.splice(idx, 1);
                            updateSectionContent(activeSectionIdx, { questions: list });
                          }}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-400"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <input 
                          type="text" 
                          placeholder="Pregunta"
                          className="glass-input w-full text-xs pr-7"
                          value={item.q || ''}
                          onChange={e => {
                            const list = [...sections[activeSectionIdx].content_json.questions];
                            list[idx].q = e.target.value;
                            updateSectionContent(activeSectionIdx, { questions: list });
                          }}
                        />
                        <textarea 
                          placeholder="Respuesta"
                          className="glass-input w-full text-xs resize-none"
                          rows="2"
                          value={item.a || ''}
                          onChange={e => {
                            const list = [...sections[activeSectionIdx].content_json.questions];
                            list[idx].a = e.target.value;
                            updateSectionContent(activeSectionIdx, { questions: list });
                          }}
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const list = [...(sections[activeSectionIdx].content_json.questions || [])];
                        list.push({ q: 'Nueva pregunta', a: 'Nueva respuesta' });
                        updateSectionContent(activeSectionIdx, { questions: list });
                      }}
                      className="w-full py-2 rounded-xl border border-dashed border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-all bg-white/[0.005] hover:bg-white/[0.01]"
                    >
                      + Añadir Pregunta
                    </button>
                  </div>
                </div>
              )}

              {sections[activeSectionIdx].type === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Título del Bloque</label>
                    <input 
                      type="text" 
                      className="glass-input text-xs" 
                      value={sections[activeSectionIdx].content_json.title || ''}
                      onChange={e => updateSectionContent(activeSectionIdx, { title: e.target.value })}
                    />
                  </div>

                  {/* Reviews list */}
                  <div className="space-y-3 border-t border-white/5 pt-3">
                    <span className="text-xs font-semibold text-slate-400">Reseñas</span>
                    
                    {(sections[activeSectionIdx].content_json.reviews || []).map((item, idx) => (
                      <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...sections[activeSectionIdx].content_json.reviews];
                            list.splice(idx, 1);
                            updateSectionContent(activeSectionIdx, { reviews: list });
                          }}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-400"
                          title="Eliminar reseña"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <input 
                          type="text" 
                          placeholder="Nombre del Cliente"
                          className="glass-input w-full text-xs pr-7 font-bold"
                          value={item.name || ''}
                          onChange={e => {
                            const list = [...sections[activeSectionIdx].content_json.reviews];
                            list[idx].name = e.target.value;
                            updateSectionContent(activeSectionIdx, { reviews: list });
                          }}
                        />
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-slate-500 font-bold uppercase">Calificación:</label>
                          <select 
                            className="bg-slate-900 border border-white/10 rounded-lg text-xs px-2 py-0.5 text-slate-200 focus:outline-none"
                            value={item.rating || 5}
                            onChange={e => {
                              const list = [...sections[activeSectionIdx].content_json.reviews];
                              list[idx].rating = parseInt(e.target.value);
                              updateSectionContent(activeSectionIdx, { reviews: list });
                            }}
                          >
                            <option value="5">5 ★★★★★</option>
                            <option value="4">4 ★★★★</option>
                            <option value="3">3 ★★★</option>
                            <option value="2">2 ★★</option>
                            <option value="1">1 ★</option>
                          </select>
                        </div>
                        <textarea 
                          placeholder="Comentario de la reseña"
                          className="glass-input w-full text-xs resize-none"
                          rows="2"
                          value={item.comment || ''}
                          onChange={e => {
                            const list = [...sections[activeSectionIdx].content_json.reviews];
                            list[idx].comment = e.target.value;
                            updateSectionContent(activeSectionIdx, { reviews: list });
                          }}
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const list = [...(sections[activeSectionIdx].content_json.reviews || [])];
                        list.push({ name: 'Cliente Satisfecho', rating: 5, comment: 'Excelente calidad del producto, envío muy rápido.' });
                        updateSectionContent(activeSectionIdx, { reviews: list });
                      }}
                      className="w-full py-2 rounded-xl border border-dashed border-white/10 text-xs font-semibold text-slate-400 hover:text-white transition-all bg-white/[0.005] hover:bg-white/[0.01]"
                    >
                      + Añadir Reseña
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              Asistente de Redacción SEO con IA
            </h3>
            <p className="text-xs text-slate-400 mb-6">Genera automáticamente Metaetiquetas SEO de alta calidad para indexación en buscadores.</p>
            
            <div className="space-y-5">
              <form onSubmit={handleGenerateSEO} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ej: Calzado deportivo cómodo para correr maratones" 
                  className="glass-input flex-1"
                  value={seoTopic}
                  onChange={e => setSeoTopic(e.target.value)}
                  required 
                />
                <button 
                  type="submit"
                  disabled={generatingSeo}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all shrink-0 flex items-center gap-1.5"
                >
                  {generatingSeo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generar</span>
                </button>
              </form>

              <div className="border-t border-white/5 pt-5 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Meta Title</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold">Meta Description</label>
                  <textarea 
                    className="glass-input resize-none" 
                    rows="3"
                    value={seoDesc}
                    onChange={e => setSeoDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-all"
                  onClick={() => setSeoModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSaveSEO}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition-all"
                >
                  Aplicar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PUBLISHED SUCCESS MODAL */}
      {pubResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-purple-500/30 text-center relative shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mx-auto mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">¡Página Publicada Exitosamente!</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">Tu landing page ya está en vivo y optimizada en la CDN para vender tus productos.</p>
            
            <div className="p-4 rounded-xl bg-purple-600/10 border border-purple-500/20 text-sm font-mono break-all mb-8 flex items-center justify-between gap-2">
              <span className="text-purple-300">https://{pubResult.domain}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(`https://${pubResult.domain}`); alert('URL copiado'); }}
                className="p-1 rounded bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 transition-all"
                title="Copiar URL"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a 
                href={pubResult.url} 
                target="_blank" 
                rel="noreferrer"
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-bold text-white transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Landing</span>
              </a>
              <button 
                onClick={() => setPubResult(null)}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold text-slate-300 transition-all border border-white/10"
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
