import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { 
  Sparkles, Sliders, Download, Wand2, RefreshCw, 
  FileImage, HelpCircle, Check, Search, Upload, Trash2, 
  ChevronLeft, ChevronRight, ArrowLeft, Plus, DollarSign, Folder,
  Play, X, Globe, Maximize2, FileText, CheckCircle2, Eye, Palette,
  Users, Tag, Truck, Info
} from 'lucide-react';
import { storage, ref, uploadBytes, getDownloadURL } from '../utils/firebase.js';
import { getProductDisplayImage, getProductImagesArray } from '../utils/productUtils.js';

// Sub-component for template item inside gallery modal
function TemplateGridItem({ template, onSelect, getTemplateDownloadUrl, onDeleteTemplate, isSelected }) {
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
      className={`glass-panel border rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.01] transition-all duration-300 aspect-[3/4] relative group ${
        isSelected 
          ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/10' 
          : 'border-white/5 hover:border-purple-500/30'
      }`}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
          <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
        </div>
      ) : (
        <img src={imageUrl} alt={template.name} className="w-full h-full object-cover" />
      )}
      
      {/* Selection overlay indicator */}
      {isSelected && (
        <div className="absolute top-3 left-3 bg-purple-600 text-white rounded-full p-1 border border-purple-400 shadow-md z-10 animate-scaleIn">
          <Check className="w-3 h-3" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-end">
        <h5 className="text-[10px] font-bold text-white truncate">{template.name.replace(/\.[^/.]+$/, "")}</h5>
      </div>

      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('¿Estás seguro de que deseas eliminar esta plantilla de referencia?')) {
            onDeleteTemplate(template.name);
          }
        }}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-red-600/95 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 z-10"
        title="Eliminar plantilla"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Modal for Template Selection Gallery
function TemplateSelectionModal({ 
  isOpen, 
  onClose, 
  templates, 
  onSelect, 
  getTemplateDownloadUrl, 
  searchQuery, 
  setSearchQuery, 
  isUploading, 
  handleFileUpload,
  onDeleteTemplate,
  selectedTemplate
}) {
  const [activeTab, setActiveTab] = useState('hero');
  const [page, setPage] = useState(1);
  const [localSelected, setLocalSelected] = useState(selectedTemplate || '');

  // Reset page when active tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Sync selection when selectedTemplate changes or when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelected(selectedTemplate || '');
    }
  }, [selectedTemplate, isOpen]);

  if (!isOpen) return null;

  const categories = [
    { id: 'hero', name: 'Hero' },
    { id: 'oferta', name: 'Oferta' },
    { id: 'antes-despues', name: 'Antes/Después' },
    { id: 'beneficios', name: 'Beneficios' },
    { id: 'tabla-comparativa', name: 'Tabla Comparativa' },
    { id: 'prueba-autoridad', name: 'Prueba de Autoridad' },
    { id: 'testimonios', name: 'Testimonios' },
    { id: 'modo-uso', name: 'Modo de Uso' },
    { id: 'logistica', name: 'Logística' },
    { id: 'preguntas-frecuentes', name: 'Preguntas Frecuentes' }
  ];

  const activeCategory = categories.find(c => c.id === activeTab) || categories[0];
  const itemsPerPage = 12; // 12 items (fits a 6 column grid nicely)

  const filtered = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const filename = t.name.toLowerCase();
    let fileCategory = 'hero'; // default fallback
    
    for (const cat of categories) {
      if (filename.startsWith(cat.id + '_')) {
        fileCategory = cat.id;
        break;
      }
    }

    return fileCategory === activeTab;
  });
  
  const totalP = Math.ceil(filtered.length / itemsPerPage) || 1;
  const displayed = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-8">
      <div className="w-full max-w-6xl glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative max-h-[90vh] overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Folder className="w-5 h-5 text-purple-400" />
                <span>Plantillas de Secciones</span>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-600/25 border border-purple-500/30 text-purple-400 text-[11px] font-extrabold tracking-wide">{filtered.length}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Selecciona una sección de landing de referencia para guiar el diseño de la IA.</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Ecom Magic visual indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900 text-slate-300 text-xs font-semibold">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Ecom Magic</span>
              </div>
              <button 
                type="button" 
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Categories Tab Bar */}
          <div className="flex items-center gap-2 mb-5">
            <button 
              type="button" 
              onClick={() => {
                const container = document.getElementById('categories-tab-container');
                if (container) container.scrollLeft -= 200;
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div 
              id="categories-tab-container"
              className="flex-1 flex gap-2 overflow-x-auto scrollbar-none scroll-smooth pb-1"
            >
              {categories.map(cat => {
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveTab(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                      isActive 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                        : 'bg-slate-950 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            <button 
              type="button" 
              onClick={() => {
                const container = document.getElementById('categories-tab-container');
                if (container) container.scrollLeft += 200;
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Action bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-6">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Buscar plantilla..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                className="bg-slate-950 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500/50 w-full"
              />
            </div>

            <label className="cursor-pointer bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all w-full sm:w-auto justify-center">
              {isUploading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isUploading ? 'Subiendo...' : `Subir a pestaña ${activeCategory.name}`}</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={async (e) => {
                  const newName = await handleFileUpload(e, activeCategory.id + '_');
                  if (newName) {
                    setLocalSelected(newName);
                  }
                }} 
                className="hidden" 
                disabled={isUploading}
                multiple
              />
            </label>
          </div>

          {/* Templates Grid */}
          <div className="min-h-[300px]">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {/* Tarjeta de subida integrada para la pestaña activa */}
              <label className="border-2 border-dashed border-white/10 hover:border-purple-500/50 bg-white/[0.02] hover:bg-purple-500/[0.02] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group aspect-[3/4] p-4 text-center">
                {isUploading ? (
                  <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 mb-2">
                    <Upload className="w-4.5 h-4.5" />
                  </div>
                )}
                <span className="text-[11px] font-bold text-slate-200 group-hover:text-purple-400 transition-colors">Subir Imagen</span>
                <span className="text-[9px] text-slate-500 mt-1 line-clamp-2">Para pestaña {activeCategory.name}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const newName = await handleFileUpload(e, activeCategory.id + '_');
                    if (newName) {
                      setLocalSelected(newName);
                    }
                  }} 
                  className="hidden" 
                  disabled={isUploading}
                  multiple
                />
              </label>

              {displayed.map(temp => (
                <TemplateGridItem
                  key={temp.name}
                  template={temp}
                  isSelected={localSelected === temp.name}
                  onSelect={() => setLocalSelected(temp.name)}
                  getTemplateDownloadUrl={getTemplateDownloadUrl}
                  onDeleteTemplate={onDeleteTemplate}
                />
              ))}
            </div>
            {displayed.length === 0 && (
              <p className="text-center text-xs text-slate-500 mt-6 italic">No hay más plantillas predefinidas en esta sección. ¡Sube las tuyas!</p>
            )}
          </div>
        </div>

        {/* Pagination & Footer Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/5 pt-4 mt-6 gap-4">
          <div>
            {totalP > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-white/5 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-300 font-semibold">{page} / {totalP}</span>
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.min(totalP, prev + 1))}
                  disabled={page === totalP}
                  className="p-2 rounded-xl border border-white/5 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-slate-500 ml-2">
                  (Mostrando {Math.min(filtered.length, (page - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, page * itemsPerPage)} de {filtered.length})
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Haz clic en un template para seleccionarlo</span>
            )}
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => alert('Generación Masiva próximamente en la versión PRO')}
              className="px-4 py-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-950/40 transition-all relative group"
            >
              <span>Generación Masiva</span>
              <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-purple-500 text-white rounded-full uppercase tracking-wider scale-90">Nuevo</span>
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-xs font-bold transition-all"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!localSelected}
              onClick={() => {
                if (localSelected) {
                  onSelect(localSelected);
                  onClose();
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-30 disabled:hover:bg-purple-600"
            >
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal for Video Tutorial
function TutorialModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
      <div className="w-full max-w-2xl glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-purple-400" />
            <span>Videotutorial: Generador de Landings</span>
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950 relative">
          <iframe 
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
            title="Video Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        
        <div className="mt-4 text-xs text-slate-400 leading-relaxed">
          Aprende cómo estructurar las secciones de tu landing page (Hero, Oferta, Testimonios) usando referencias visuales de alta conversión, organizando fotos de tus productos y configurando colores corporativos.
        </div>
      </div>
    </div>
  );
}

// Modal for Success Result Generation
function SuccessModal({ isOpen, onClose, imageUrl, productName }) {
  if (!isOpen || !imageUrl) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
      <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-white/10 relative text-center space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
            <span>¡Sección de Landing Generada Exitosamente!</span>
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-slate-950 aspect-video relative">
          <img src={imageUrl} alt="Generated Landing Block" className="w-full h-full object-cover" />
        </div>

        <div className="text-left py-1">
          <p className="text-[10px] text-slate-500">Producto asociado</p>
          <p className="text-xs font-bold text-slate-200 truncate">{productName}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-all"
          >
            Cerrar
          </button>
          
          <a 
            href={imageUrl}
            download="ecom-magic-landing.webp"
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-3 text-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Imagen</span>
          </a>
        </div>
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
    createProduct,
    createProject,
    updateProduct,
    
    // Landing templates
    landingTemplates,
    isLoadingTemplates,
    fetchLandingTemplates,
    getTemplateDownloadUrl,
    uploadLandingTemplate,
    deleteLandingTemplate
  } = useStore();

  // Navigation state (Null means show product grid dashboard)
  const [selectedProductForGen, setSelectedProductForGen] = useState(null);

  // Form State
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedTemplateUrl, setSelectedTemplateUrl] = useState('');
  const [customImage, setCustomImage] = useState('');
  const [productImages, setProductImages] = useState(['', '', '']);
  const [slotUploading, setSlotUploading] = useState([false, false, false]);

  const [format, setFormat] = useState('16:9'); // default for landing pages
  const [language, setLanguage] = useState('es');
  const [engine, setEngine] = useState('kie-ai'); // kie-ai or openai
  const [bgColor, setBgColor] = useState('#0f172a'); // default background
  const [customStyleEnabled, setCustomStyleEnabled] = useState(false);
  const [customStyle, setCustomStyle] = useState('');
  const [calidad, setCalidad] = useState('medio');

  // Personalización del Bloque states
  const [charNationality, setCharNationality] = useState('Colombia');
  const [charGender, setCharGender] = useState('Mujer');
  const [charAgeRange, setCharAgeRange] = useState('25 - 35');

  const [offerAntes1, setOfferAntes1] = useState('');
  const [offerPrecio1, setOfferPrecio1] = useState('0');
  const [offerAntes2, setOfferAntes2] = useState('');
  const [offerPrecio2, setOfferPrecio2] = useState('0');
  const [offerAntes3, setOfferAntes3] = useState('');
  const [offerPrecio3, setOfferPrecio3] = useState('0');
  const [offerCurrency, setOfferCurrency] = useState('Estados Unidos — USD ($)');

  const [logisticsCountry, setLogisticsCountry] = useState('');

  // Pagination & Search State (inside template selection modal)
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingReference, setIsUploadingReference] = useState(false);

  // Modals state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Product Creation Modal State
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Project Creation Modal State
  const [showProjModal, setShowProjModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    setIsSavingProject(true);
    const result = await createProject(newProjName);
    if (result) {
      setNewProjName('');
      setShowProjModal(false);
    }
    setIsSavingProject(false);
  };

  // Results State
  const [successImages, setSuccessImages] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchProjects();
    fetchLandingTemplates();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectImages(selectedProject.id);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      selectProject(projects[0]);
    }
  }, [projects, selectedProject]);

  useEffect(() => {
    if (landingTemplates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(landingTemplates[0].name);
    }
  }, [landingTemplates]);

  // Handle template selection and fetch preview URL
  useEffect(() => {
    if (selectedTemplate) {
      const loadTemplateUrl = async () => {
        const path = `landing_templates/WEBP_25%/${selectedTemplate}`;
        const url = await getTemplateDownloadUrl(path);
        setSelectedTemplateUrl(url);
      };
      loadTemplateUrl();
    } else if (customImage) {
      setSelectedTemplateUrl(customImage);
    } else {
      setSelectedTemplateUrl('');
    }
  }, [selectedTemplate, customImage]);

  // Prepopulate Product Images on product selection
  useEffect(() => {
    if (selectedProductForGen) {
      if (selectedProductForGen.id === 'new') {
        setProductImages(['', '', '']);
      } else {
        setProductImages(getProductImagesArray(selectedProductForGen.cover_image));
      }
      setSuccessImages([]);
    }
  }, [selectedProductForGen]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      alert('Por favor selecciona una Campaña/Proyecto en la esquina superior para asociar las imágenes.');
      return;
    }
    if (!selectedProductForGen) {
      alert('Por favor selecciona un producto.');
      return;
    }

    let currentProduct = selectedProductForGen;

    // If it's a new product, register it first
    if (selectedProductForGen.id === 'new') {
      if (!newProdName.trim()) {
        alert('Por favor ingresa el nombre del producto.');
        return;
      }
      if (!newProdDescription.trim()) {
        alert('Por favor ingresa la descripción del producto.');
        return;
      }
      
      setIsSavingProduct(true);
      const payload = {
        name: newProdName,
        description: newProdDescription,
        price: parseFloat(newProdPrice) || 0,
        category: newProdCategory,
        cover_image: JSON.stringify(productImages),
        status: 'active'
      };

      const newProd = await createProduct(payload);
      setIsSavingProduct(false);

      if (!newProd) {
        return;
      }

      currentProduct = newProd;
      setSelectedProductForGen(newProd);
      fetchProducts();
    }

    let refImageUrl = '';
    if (customImage.trim()) {
      refImageUrl = customImage.trim();
    } else if (selectedTemplate) {
      const highQualityPath = `landing_templates/WEBP_100%/${selectedTemplate}`;
      refImageUrl = await getTemplateDownloadUrl(highQualityPath);
    }

    // Build rich prompt for landing section layout
    let promptText = `Landing page section composition. Product: ${currentProduct.name}. Background color: ${bgColor}. Description: ${currentProduct.description}. referencing selected composition layout.`;
    
    if (customStyleEnabled) {
      let personalizationParts = [];
      
      // Character Adaptation info
      if (charNationality || charGender || charAgeRange) {
        let charDesc = 'Target Audience / Characters:';
        if (charNationality) charDesc += ` Nationality/Appearance: ${charNationality}.`;
        if (charGender) charDesc += ` Gender: ${charGender}.`;
        if (charAgeRange) charDesc += ` Age Range: ${charAgeRange}.`;
        personalizationParts.push(charDesc);
      }
      
      // Offer configuration info
      let offerDesc = '';
      if (offerPrecio1 && offerPrecio1 !== '0') {
        offerDesc += ` 1 unit price: ${offerAntes1 ? `before ${offerAntes1} ${offerCurrency}, ` : ''}now ${offerPrecio1} ${offerCurrency}.`;
      }
      if (offerPrecio2 && offerPrecio2 !== '0') {
        offerDesc += ` 2 units price: ${offerAntes2 ? `before ${offerAntes2} ${offerCurrency}, ` : ''}now ${offerPrecio2} ${offerCurrency}.`;
      }
      if (offerPrecio3 && offerPrecio3 !== '0') {
        offerDesc += ` 3 units price: ${offerAntes3 ? `before ${offerAntes3} ${offerCurrency}, ` : ''}now ${offerPrecio3} ${offerCurrency}.`;
      }
      if (offerDesc) {
        personalizationParts.push(`Offer details (display these exact prices): ${offerDesc}`);
      }
      
      // Logistics country info
      if (logisticsCountry) {
        personalizationParts.push(`Logistics / Shipping Target Country: ${logisticsCountry}.`);
      }
      
      if (personalizationParts.length > 0) {
        promptText += ` Block Personalization Info: ${personalizationParts.join(' | ')}.`;
      }
      
      if (customStyle.trim()) {
        promptText += ` Additional style/design requirements: ${customStyle}`;
      }
    } else {
      if (customStyle.trim()) {
        promptText += ` Style customization: ${customStyle}`;
      }
    }

    // Find the first valid product image URL (uploaded or cover image)
    const placeholderUrl = 'images.unsplash.com/photo-1523275335684-37898b6baf30';
    const primaryProductImage = productImages.find(img => img && img.trim() !== '' && !img.includes(placeholderUrl)) || '';

    if (engine === 'openai' && !primaryProductImage) {
      alert('Debes subir al menos una imagen del producto para usar el motor OpenAI.');
      return;
    }

    const results = await generateImages(
      promptText,
      selectedTemplate || 'custom',
      format,
      1,
      selectedProject.id,
      engine,
      refImageUrl,
      primaryProductImage,
      calidad
    );

    if (results && results.length > 0) {
      setSuccessImages(results);
      setShowSuccessModal(true);
      fetchProjectImages(selectedProject.id);
    }
  };

  const handleFileUpload = async (e, prefix = '') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return null;
    
    setIsUploading(true);
    let lastUploadedName = null;
    try {
      for (const file of files) {
        const uploadedName = await uploadLandingTemplate(file, prefix);
        if (uploadedName) {
          lastUploadedName = uploadedName;
        }
      }
    } catch (err) {
      console.error('Error during bulk file upload:', err);
    } finally {
      setIsUploading(false);
    }
    
    if (lastUploadedName) {
      setSelectedTemplate(lastUploadedName);
      setCustomImage('');
      return lastUploadedName;
    }
    return null;
  };

  const handleReferenceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploadingReference(true);
    try {
      const fileName = `templates/custom/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setCustomImage(url);
      setSelectedTemplate('');
      setSelectedTemplateUrl(url);
    } catch (err) {
      console.error('Error uploading custom reference image:', err);
      alert('Error al subir la referencia local: ' + err.message);
    } finally {
      setIsUploadingReference(false);
    }
  };

  const handleProductImageUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const newUploading = [...slotUploading];
    newUploading[index] = true;
    setSlotUploading(newUploading);
    
    try {
      const productId = selectedProductForGen.id === 'new' ? `temp-${Date.now()}` : selectedProductForGen.id;
      const fileName = `products/${productId}-${index}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      const newImages = [...productImages];
      newImages[index] = url;
      setProductImages(newImages);

      // Persist to database if existing product
      if (selectedProductForGen.id !== 'new') {
        const serialized = JSON.stringify(newImages);
        await updateProduct(selectedProductForGen.id, { cover_image: serialized });
        setSelectedProductForGen(prev => ({ ...prev, cover_image: serialized }));
        fetchProducts();
      }
    } catch (err) {
      console.error('Error uploading product photo:', err);
      alert('Error al subir la foto del producto: ' + err.message);
    } finally {
      const newUploading = [...slotUploading];
      newUploading[index] = false;
      setSlotUploading(newUploading);
    }
  };

  const removeProductImage = async (index) => {
    const newImages = [...productImages];
    newImages[index] = '';
    setProductImages(newImages);

    // Persist to database if existing product
    if (selectedProductForGen.id !== 'new') {
      const serialized = JSON.stringify(newImages);
      await updateProduct(selectedProductForGen.id, { cover_image: serialized });
      setSelectedProductForGen(prev => ({ ...prev, cover_image: serialized }));
      fetchProducts();
    }
  };

  const handleDownloadGuide = () => {
    const element = document.createElement("a");
    const fileContent = "Guía de Optimización de Secciones de Landing EcomMagic:\n\n1. Estructura: Carga y selecciona plantillas correspondientes a bloques específicos (Hero banner, beneficios, ofertas, CTA).\n2. Fotos de Producto: Sube de 1 a 3 fotos claras y nítidas. La IA recortará y adaptará el producto al diseño.\n3. Colores Corporativos: Define el color de fondo para mantener consistencia con tu marca.\n4. Motores: Usa el Modelo Ecom Magic para composiciones fotorrealistas integradas y GPT Image 2 para renders con alta dosis creativa.";
    const file = new Blob([fileContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "Guia_Optimizacion_Landings.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Filter history blocks for selected product
  const productBanners = selectedProductForGen 
    ? (selectedProductForGen.id === 'new'
      ? []
      : generatedImages.filter(img => 
          img.prompt && selectedProductForGen.name && img.prompt.toLowerCase().includes(selectedProductForGen.name.toLowerCase())
        )
      )
    : [];

  // VIEW 1: Dashboard Product Grid (Dashboard View)
  if (selectedProductForGen === null) {
    return (
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-400 bg-clip-text text-transparent">
              Generador de Landings
            </h2>
            <p className="text-slate-400 mt-2 text-sm">
              Organiza tus productos y genera bloques visuales de landing pages listos para vender
            </p>
          </div>
          
          {/* Project Selector top right */}
          <div className="flex items-center gap-2 bg-slate-900 border border-white/5 px-4 py-2 rounded-2xl">
            <span className="text-xs text-slate-500 font-semibold">Campaña:</span>
            <select
              className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
              value={selectedProject?.id || ''}
              onChange={e => {
                const proj = projects.find(p => p.id === e.target.value);
                if (proj) selectProject(proj);
              }}
            >
              <option value="" disabled className="bg-slate-950">Selecciona Proyecto...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-950">{p.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowProjModal(true)}
              className="p-1 rounded-lg hover:bg-white/5 text-purple-400 hover:text-purple-300 transition-all ml-1"
              title="Nueva Campaña/Proyecto"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => {
            const count = generatedImages.filter(img => 
              img.prompt && product.name && img.prompt.toLowerCase().includes(product.name.toLowerCase())
            ).length;
            
            const countText = count > 0 
              ? `${count} Sección${count > 1 ? 'es' : ''}` 
              : '0 Secciones'; 

            return (
              <div 
                key={product.id}
                onClick={() => setSelectedProductForGen(product)}
                className="glass-panel border border-white/10 rounded-3xl overflow-hidden cursor-pointer hover:shadow-xl hover:border-purple-500/30 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group h-full min-h-[320px]"
              >
                {/* Product Cover Image */}
                <div className="aspect-square w-full relative bg-slate-950 overflow-hidden rounded-t-3xl">
                  <img 
                    src={getProductDisplayImage(product.cover_image)} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  
                  {/* Category Badge */}
                  {product.category && (
                    <div className="absolute top-4 left-4">
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-black/60 border border-white/10 text-purple-300 uppercase tracking-wider">
                        {product.category}
                      </span>
                    </div>
                  )}

                  {/* Price Tag */}
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-xs font-extrabold text-white">${product.price}</span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 flex-1 flex flex-col items-center justify-center text-center space-y-2">
                  <h4 className="font-bold text-slate-100 group-hover:text-purple-400 transition-colors line-clamp-1">
                    {product.name}
                  </h4>
                  
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-purple-600/10 text-purple-400 border border-purple-500/20">
                    {countText}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Add Product Card */}
          <div 
            onClick={() => {
              setNewProdName('');
              setNewProdPrice('');
              setNewProdCategory('');
              setNewProdDescription('');
              setSelectedProductForGen({
                id: 'new',
                name: '',
                description: '',
                price: '',
                category: '',
                cover_image: ''
              });
            }}
            className="glass-panel border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/[0.02] rounded-3xl p-6 flex flex-col items-center justify-center min-h-[320px] text-center cursor-pointer transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-purple-600 flex items-center justify-center text-slate-400 group-hover:text-white shadow-lg transition-all mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-200 group-hover:text-purple-400 transition-colors">
              Agregar producto
            </h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-[200px] leading-relaxed">
              Crea un nuevo producto
            </p>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: Landing Generation Detail (rendered when a product is selected)
  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8 animate-fadeIn relative">
      
      {/* Loading Overlay */}
      {isGeneratingImages && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="glass-panel p-10 rounded-3xl border border-white/10 text-center max-w-sm space-y-6 animate-pulse">
            <RefreshCw className="w-16 h-16 text-purple-400 animate-spin mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Generando Sección de Landing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                La inteligencia artificial está construyendo la estructura visual del bloque, integrando tus fotos corporativas y aplicando el color de fondo corporativo de manera integrada.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <button 
            type="button" 
            onClick={() => setSelectedProductForGen(null)}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all duration-300 mt-1 shadow-md"
            title="Volver al Catálogo"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase break-all">
              {selectedProductForGen.id === 'new' ? 'Registrar Producto' : selectedProductForGen.name}
            </h2>
            <p className="text-slate-400 mt-1 text-xs font-semibold tracking-wide">
              {selectedProductForGen.id === 'new' 
                ? 'Registra tu producto y genera secciones de landing pages con IA' 
                : 'Genera Bloques de Landing Pages profesionales para este producto'}
            </p>
          </div>
        </div>

        {/* Buttons right */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Campaign/Project Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-white/5 px-4 py-2 rounded-2xl">
            <span className="text-xs text-slate-500 font-semibold">Campaña:</span>
            <select
              className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
              value={selectedProject?.id || ''}
              onChange={e => {
                const proj = projects.find(p => p.id === e.target.value);
                if (proj) selectProject(proj);
              }}
            >
              <option value="" disabled className="bg-slate-950">Selecciona Proyecto...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-950">{p.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowProjModal(true)}
              className="p-1 rounded-lg hover:bg-white/5 text-purple-400 hover:text-purple-300 transition-all ml-1"
              title="Nueva Campaña/Proyecto"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadGuide}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-700/60 hover:bg-purple-700 text-white border border-purple-500/20 text-xs font-bold transition-all shadow-lg hover:shadow-purple-500/10"
          >
            <FileText className="w-4 h-4 text-purple-200" />
            <span>Descargar Guía</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowTutorialModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-500/10"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Ver Tutorial</span>
          </button>
        </div>
      </div>

      {/* Generar Nueva Landing Main Form Card */}
      <form onSubmit={handleGenerate} className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 bg-[#0e0e11] space-y-6 shadow-xl relative overflow-hidden">
        
        {/* Form Title & Subtitle */}
        <div className="flex items-start gap-3 border-b border-white/5 pb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-md">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Generar Sección de Landing</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sube una estructura de landing como referencia y fotos reales de tu producto</p>
          </div>
        </div>

        {/* If it's a new product, render the product registration inputs */}
        {selectedProductForGen.id === 'new' && (
          <div className="space-y-4 p-5 rounded-2xl bg-purple-950/10 border border-purple-500/10 mb-6">
            <h4 className="text-[10px] font-extrabold text-purple-300 uppercase tracking-wider">Paso 1: Registrar Información del Producto</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Nombre del Producto</label>
                <input 
                  type="text" 
                  placeholder="Ej: Cobija piel de conejo" 
                  className="glass-input bg-slate-950/60"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Precio de Venta ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="glass-input bg-slate-950/60"
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                    required 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Categoría</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Hogar" 
                    className="glass-input bg-slate-950/60"
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Descripción Comercial (Dolores y Beneficios)</label>
              <textarea 
                rows="3"
                placeholder="Ej: Cobija térmica ultrasuave ideal para invierno. Es antialérgica, ligera y lavable..." 
                className="glass-input bg-slate-950/60 resize-none text-xs"
                value={newProdDescription}
                onChange={e => setNewProdDescription(e.target.value)}
                required 
              />
            </div>
          </div>
        )}

        {/* Double Panel Grid (Referencia & Foto del Producto) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Panel: Referencia */}
          <div className="space-y-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 tracking-wide">Estructura de Referencia</label>
              
              {/* PC Upload */}
              <label className="cursor-pointer bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all">
                {isUploadingReference ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingReference ? 'Subiendo...' : 'Subir desde PC'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleReferenceUpload} 
                  className="hidden" 
                  disabled={isUploadingReference}
                />
              </label>
            </div>

            {/* Template Selection Box */}
            <div className="flex-1 min-h-[180px] flex flex-col justify-center">
              {selectedTemplateUrl ? (
                <div className="relative h-44 rounded-2xl overflow-hidden border border-purple-500/30 group shadow-md cursor-pointer" onClick={() => setShowTemplateModal(true)}>
                  <img src={selectedTemplateUrl} alt="Template composition" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-white" />
                    <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">Cambiar Plantilla</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate('');
                      setCustomImage('');
                      setSelectedTemplateUrl('');
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-red-600/90 text-white transition-colors"
                    title="Quitar plantilla"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => setShowTemplateModal(true)}
                  className="h-44 border-2 border-dashed border-white/10 hover:border-purple-500/50 bg-white/[0.01] hover:bg-purple-500/[0.01] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white shadow-lg transition-all duration-300 mb-3">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">Seleccionar Plantilla</span>
                  <span className="text-[10px] text-slate-500 mt-1">de la Galería EcommMagic</span>
                </div>
              )}
            </div>

            {/* Custom URL input */}
            <div className="flex flex-col gap-1.5 mt-2">
              <input
                type="text"
                placeholder="O ingresa enlace de imagen: https://ejemplo.com/landing.jpg"
                className="glass-input text-[11px] py-2 bg-slate-950/60"
                value={customImage}
                onChange={e => {
                  setCustomImage(e.target.value);
                  setSelectedTemplate('');
                }}
              />
            </div>
          </div>

          {/* Right Panel: Foto del Producto */}
          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-200 tracking-wide block">Fotos del Producto</label>
              <span className="text-[10px] text-slate-500 font-medium">(agrega de 1 a 3 fotos de tu producto)</span>
            </div>

            {/* 3 Grid slots */}
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map(index => {
                const imgUrl = productImages[index];
                const uploading = slotUploading[index];

                return (
                  <div key={index} className="aspect-square relative flex items-center justify-center">
                    {uploading ? (
                      <div className="absolute inset-0 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                      </div>
                    ) : imgUrl ? (
                      <div className="absolute inset-0 rounded-2xl overflow-hidden border border-white/10 group shadow-md bg-slate-950">
                        <img src={imgUrl} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <label className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors mr-1">
                            <Upload className="w-3.5 h-3.5" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={e => handleProductImageUpload(index, e)} 
                              className="hidden" 
                            />
                          </label>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeProductImage(index)}
                              className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <label className="absolute inset-0 border-2 border-dashed border-white/10 hover:border-purple-500/40 bg-white/[0.01] hover:bg-purple-500/[0.01] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group">
                        <Plus className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors mb-1" />
                        <span className="text-[9px] font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-wider">Imagen {index + 1}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => handleProductImageUpload(index, e)} 
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Color de Fondo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Color de Fondo</span>
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
              />
              <input 
                type="text"
                className="bg-slate-950 border border-white/5 rounded-xl text-xs font-mono text-center py-2.5 flex-1 focus:outline-none focus:border-purple-500/50"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
              />
            </div>
          </div>

          {/* Format selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Tamaño de Sección</span>
            </label>
            <select 
              value={format} 
              onChange={e => setFormat(e.target.value)}
              className="bg-slate-950 border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500/50 cursor-pointer w-full transition-all"
            >
              <option value="16:9">Largo (16:9 - Escritorio)</option>
              <option value="1:1">Cuadrado (1:1 - Redes/Móvil)</option>
              <option value="9:16">Alto (9:16 - Móvil Vertical)</option>
            </select>
          </div>

          {/* Copy Language selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Idioma</span>
            </label>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              className="bg-slate-950 border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500/50 cursor-pointer w-full transition-all"
            >
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="pt">Portugués</option>
            </select>
          </div>

          {/* Quality selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Calidad de Imagen</span>
            </label>
            <select 
              value={calidad} 
              onChange={e => setCalidad(e.target.value)}
              className="bg-slate-950 border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500/50 cursor-pointer w-full transition-all"
            >
              <option value="bajo">Bajo (Generación rápida)</option>
              <option value="medio">Medio (Recomendado)</option>
              <option value="alto">Alto (Calidad profesional)</option>
            </select>
          </div>
        </div>

        {/* Switches Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-white/5">
          
          {/* Engine select switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">Modelo Ecom Magic</span>
            <button
              type="button"
              onClick={() => setEngine(engine === 'kie-ai' ? 'openai' : 'kie-ai')}
              className="w-11 h-6 rounded-full bg-slate-950 p-0.5 transition-colors duration-300 relative focus:outline-none border border-white/10"
              title="Cambiar Motor de Generación"
            >
              <div 
                className={`w-5 h-5 rounded-full bg-purple-500 shadow-md transform duration-300 ${
                  engine === 'openai' ? 'translate-x-5 bg-indigo-500' : ''
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">GPT Image 2</span>
              <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-purple-500/25 text-purple-400 border border-purple-500/30 rounded uppercase tracking-wider">Nuevo</span>
            </div>
          </div>

          {/* Personalization switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">Personalizacion del Bloque</span>
            <button
              type="button"
              onClick={() => setCustomStyleEnabled(!customStyleEnabled)}
              className="w-11 h-6 rounded-full bg-slate-950 p-0.5 transition-colors duration-300 relative focus:outline-none border border-white/10"
            >
              <div 
                className={`w-5 h-5 rounded-full bg-purple-500 shadow-md transform duration-300 ${
                  customStyleEnabled ? 'translate-x-5 bg-indigo-500' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Conditional text input for Custom Style directions */}
        {/* Conditional Personalization Section */}
        {customStyleEnabled && (
          <div className="space-y-6 pt-2 animate-fadeIn">
            {/* 1. ADAPTAR PERSONAJES */}
            <div className="p-5 rounded-2xl bg-[#0e0e11]/80 border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-200 font-extrabold text-[11px] uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>Adaptar Personajes</span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider">(Opcional)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nacionalidad</label>
                  <select
                    value={charNationality}
                    onChange={e => setCharNationality(e.target.value)}
                    className="bg-slate-950 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500/50 cursor-pointer w-full transition-all"
                  >
                    <option value="">No especificado</option>
                    <option value="Colombia">Colombia</option>
                    <option value="México">México</option>
                    <option value="Chile">Chile</option>
                    <option value="Perú">Perú</option>
                    <option value="Ecuador">Ecuador</option>
                    <option value="España">España</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Venezuela">Venezuela</option>
                    <option value="Bolivia">Bolivia</option>
                    <option value="Guatemala">Guatemala</option>
                    <option value="Costa Rica">Costa Rica</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Paraguay">Paraguay</option>
                    <option value="Honduras">Honduras</option>
                    <option value="El Salvador">El Salvador</option>
                    <option value="Nicaragua">Nicaragua</option>
                    <option value="Panamá">Panamá</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sexo</label>
                  <select
                    value={charGender}
                    onChange={e => setCharGender(e.target.value)}
                    className="bg-slate-950 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500/50 cursor-pointer w-full transition-all"
                  >
                    <option value="">No especificado</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Ambos">Ambos</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rango de Edad</label>
                  <select
                    value={charAgeRange}
                    onChange={e => setCharAgeRange(e.target.value)}
                    className="bg-slate-950 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500/50 cursor-pointer w-full transition-all"
                  >
                    <option value="">No especificado</option>
                    <option value="25 - 35">25 - 35</option>
                    <option value="18 - 24">18 - 24</option>
                    <option value="36 - 50">36 - 50</option>
                    <option value="50+">50+</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCharNationality('');
                    setCharGender('');
                    setCharAgeRange('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer focus:outline-none transition-colors"
                >
                  Limpiar opciones de personaje
                </button>
              </div>
            </div>

            {/* 2. CONFIGURACIÓN PARA LA SECCIÓN DE OFERTA */}
            <div className="p-5 rounded-2xl bg-[#0e0e11]/80 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-slate-200 font-extrabold text-[11px] uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Configuración para la Sección de Oferta</span>
              </div>

              <div className="space-y-3">
                {/* Headers */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  <div className="col-span-3 text-left"></div>
                  <div className="col-span-4">Antes (Opcional)</div>
                  <div className="col-span-5">Precio Actual</div>
                </div>

                {/* 1 unidad */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3 text-xs font-semibold text-slate-400">1 unidad</div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="—"
                      value={offerAntes1}
                      onChange={e => setOfferAntes1(e.target.value)}
                      className="glass-input bg-slate-950/60 text-xs w-full py-2 px-3 text-center"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="0"
                      value={offerPrecio1}
                      onChange={e => setOfferPrecio1(e.target.value)}
                      className="glass-input bg-slate-950/60 text-xs w-full py-2 px-3 text-center"
                    />
                  </div>
                </div>

                {/* 2 unidades */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3 text-xs font-semibold text-slate-400">2 unidades</div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="—"
                      value={offerAntes2}
                      onChange={e => setOfferAntes2(e.target.value)}
                      className="glass-input bg-slate-950/60 text-xs w-full py-2 px-3 text-center"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="0"
                      value={offerPrecio2}
                      onChange={e => setOfferPrecio2(e.target.value)}
                      className="glass-input bg-slate-950/60 text-xs w-full py-2 px-3 text-center"
                    />
                  </div>
                </div>

                {/* 3 unidades */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3 text-xs font-semibold text-slate-400">3 unidades</div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="—"
                      value={offerAntes3}
                      onChange={e => setOfferAntes3(e.target.value)}
                      className="glass-input bg-slate-950/60 text-xs w-full py-2 px-3 text-center"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="0"
                      value={offerPrecio3}
                      onChange={e => setOfferPrecio3(e.target.value)}
                      className="glass-input bg-slate-950/60 text-xs w-full py-2 px-3 text-center"
                    />
                  </div>
                </div>

                {/* Divisa */}
                <div className="grid grid-cols-12 gap-2 items-center pt-2">
                  <div className="col-span-3 text-xs font-semibold text-slate-400">Divisa</div>
                  <div className="col-span-9">
                    <select
                      value={offerCurrency}
                      onChange={e => setOfferCurrency(e.target.value)}
                      className="bg-slate-950 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500/50 cursor-pointer w-full transition-all"
                    >
                      <option value="Estados Unidos — USD ($)">Estados Unidos — USD ($)</option>
                      <option value="Colombia — COP ($)">Colombia — COP ($)</option>
                      <option value="México — MXN ($)">México — MXN ($)</option>
                      <option value="Chile — CLP ($)">Chile — CLP ($)</option>
                      <option value="Perú — PEN (S/)">Perú — PEN (S/)</option>
                      <option value="Ecuador — USD ($)">Ecuador — USD ($)</option>
                      <option value="España — EUR (€)">España — EUR (€)</option>
                      <option value="Argentina — ARS ($)">Argentina — ARS ($)</option>
                    </select>
                  </div>
                </div>

                {/* Warning / Note */}
                <div className="flex items-start gap-2 pt-2 text-[10px] text-slate-400 font-medium">
                  <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>Esta configuración aplica solamente para la generación de la sección de oferta.</span>
                </div>
              </div>
            </div>

            {/* 3. CONFIGURACIÓN PARA LA SECCIÓN LOGÍSTICA */}
            <div className="p-5 rounded-2xl bg-[#0e0e11]/80 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-slate-200 font-extrabold text-[11px] uppercase tracking-wider">
                <Truck className="w-3.5 h-3.5 text-purple-400" />
                <span>Configuración para la Sección Logística</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">País donde se realiza la logística</label>
                <select
                  value={logisticsCountry}
                  onChange={e => setLogisticsCountry(e.target.value)}
                  className="bg-slate-950 border border-white/5 hover:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500/50 cursor-pointer w-full transition-all"
                >
                  <option value="">Selecciona el país</option>
                  <option value="Colombia">Colombia</option>
                  <option value="México">México</option>
                  <option value="Chile">Chile</option>
                  <option value="Perú">Perú</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="España">España</option>
                </select>
              </div>
            </div>

            {/* 4. DETALLES ADICIONALES (TEXTAREA ORIGINAL) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400">Detalles e instrucciones de diseño adicionales para la IA</label>
              <textarea
                rows="3"
                placeholder="Ej: Estilo minimalista, sombras suaves, boton de CTA de color verde brillante que diga COMPRAR AHORA..."
                className="glass-input resize-none text-xs w-full bg-slate-950/60"
                value={customStyle}
                onChange={e => setCustomStyle(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Generate Button Area */}
        <div className="pt-6 border-t border-white/5 space-y-4 text-center">
          <button 
            type="submit"
            disabled={isGeneratingImages || (!selectedTemplate && !customImage)}
            className="w-full py-4 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-sm font-extrabold text-white rounded-2xl shadow-lg hover:shadow-purple-500/10 transition-all transform active:scale-[0.99] disabled:opacity-30 disabled:hover:from-purple-700 flex items-center justify-center gap-2 group"
          >
            <Wand2 className="w-4 h-4 text-purple-200 group-hover:animate-pulse" />
            <span>Generar Sección de Landing</span>
          </button>
          
          <p className="text-[10px] text-slate-500 font-bold tracking-wide uppercase">
            Esta generación consumirá 1 crédito
          </p>
        </div>
      </form>

      {/* History Grid ("Secciones Generadas") */}
      <div className="space-y-4 pt-10">
        <h3 className="font-extrabold text-xl text-white text-center tracking-tight">
          Secciones de Landing del Proyecto
        </h3>
        
        {productBanners.length === 0 ? (
          <div className="glass-panel border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 shadow-lg shadow-purple-500/5">
              <FileImage className="w-8 h-8 stroke-1.5" />
            </div>
            <h4 className="font-bold text-lg text-slate-100 mb-1">Aún no hay bloques</h4>
            <p className="text-xs text-slate-500 max-w-[280px]">Genera tu primer sección de landing page para ver los resultados aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {productBanners.map(img => (
              <div 
                key={img.id} 
                className="glass-panel border border-white/10 rounded-2xl overflow-hidden bg-slate-950 group relative aspect-square shadow-md hover:scale-[1.01] transition-transform duration-300"
              >
                <img src={img.image_url} alt="Generated landing block" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                
                {/* Image Details Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between">
                  <div className="flex justify-end">
                    <span className="bg-purple-600 text-white text-[8px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wide border border-purple-400">{img.model}</span>
                  </div>
                  <div className="flex justify-between items-center text-white">
                    <span className="text-[10px] truncate max-w-[120px] font-semibold">{img.prompt}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          setSuccessImages([img]);
                          setShowSuccessModal(true);
                        }}
                        className="p-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a 
                        href={img.image_url} 
                        download 
                        className="p-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
                        title="Descargar"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        templates={landingTemplates}
        onSelect={(name) => {
          setSelectedTemplate(name);
          setCustomImage('');
        }}
        getTemplateDownloadUrl={getTemplateDownloadUrl}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isUploading={isUploading}
        handleFileUpload={handleFileUpload}
        onDeleteTemplate={deleteLandingTemplate}
        selectedTemplate={selectedTemplate}
      />

      {/* Videotutorial Modal */}
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
      />

      {/* Success Popup */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        imageUrl={successImages[0]?.image_url}
        productName={selectedProductForGen?.name}
      />

      {/* Project Creation Modal */}
      {showProjModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-slate-950 border border-white/10 p-6 sm:p-8 rounded-3xl relative shadow-2xl">
            <button 
              type="button"
              onClick={() => setShowProjModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-2 text-white">Crear Nueva Campaña / Proyecto</h3>
            <p className="text-xs text-slate-400 mb-6">Asocia y agrupa las secciones generadas por IA bajo esta campaña.</p>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Nombre de la campaña</label>
                <input 
                  type="text" 
                  placeholder="Ej: Lanzamiento Invierno o Citratos" 
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  required 
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-all"
                  onClick={() => setShowProjModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSavingProject}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition-all disabled:opacity-50"
                >
                  {isSavingProject ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
