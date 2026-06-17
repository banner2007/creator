import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { 
  Sparkles, Sliders, Download, Wand2, RefreshCw, 
  FileImage, HelpCircle, Check, Search, Upload, Trash2, 
  ChevronLeft, ChevronRight, ArrowLeft, Plus, DollarSign, Folder 
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

export default function AdGenPage() {
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
    
    // Firebase templates
    firebaseTemplates,
    isLoadingTemplates,
    fetchFirebaseTemplates,
    getTemplateDownloadUrl,
    uploadFirebaseTemplate,
    deleteFirebaseTemplate
  } = useStore();

  // Navigation state (Null means show product grid dashboard)
  const [selectedProductForGen, setSelectedProductForGen] = useState(null);

  // Form State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [format, setFormat] = useState('1:1');
  const [language, setLanguage] = useState('es');
  const [engine, setEngine] = useState('kie-ai'); // kie-ai or openai
  const [customStyle, setCustomStyle] = useState('');
  const [customImage, setCustomImage] = useState('');

  // Pagination & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  // Product Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdCoverImage, setNewProdCoverImage] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);

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
      alert('Por favor selecciona un Proyecto en la esquina superior para asociar las imágenes.');
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
      // Get the high quality version URL from templates/WEBP_100%
      const highQualityPath = `templates/WEBP_100%/${selectedTemplate}`;
      refImageUrl = await getTemplateDownloadUrl(highQualityPath);
    }

    // Build rich prompt for layout model
    let promptText = `Product: ${prod.name}. Description: ${prod.description}. Style context: referencing selected composition template.`;
    if (customStyle.trim()) {
      promptText += ` Additional style directions: ${customStyle}`;
    }

    const results = await generateImages(
      promptText,
      selectedTemplate || 'custom',
      format,
      1, // Generate 1 banner per action
      selectedProject.id,
      engine,
      refImageUrl
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
      if (firebaseTemplates.length > 0) {
        setSelectedTemplate(firebaseTemplates[0].name);
      }
    }
  };

  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();
    setIsSavingProduct(true);

    const payload = {
      name: newProdName,
      description: newProdDescription,
      price: parseFloat(newProdPrice) || 0,
      category: newProdCategory,
      cover_image: newProdCoverImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
      status: 'active'
    };

    const newProd = await createProduct(payload);
    setIsSavingProduct(false);
    
    if (newProd) {
      setShowCreateModal(false);
      fetchProducts();
      // Select the newly created product for ad generation directly
      setSelectedProduct(newProd.id);
      setSelectedProductForGen(newProd);
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

  // VIEW 1: Dashboard Product Grid (as in User's screenshot)
  if (selectedProductForGen === null) {
    return (
      <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fadeIn">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-400 bg-clip-text text-transparent">
              Generador de Anuncios
            </h2>
            <p class="text-slate-400 mt-2 text-sm">
              Organiza tus productos y genera anuncios profesionales con IA
            </p>
          </div>
          
          {/* Project Selector top right */}
          <div class="flex items-center gap-2 bg-slate-900 border border-white/5 px-4 py-2 rounded-2xl">
            <span class="text-xs text-slate-500 font-semibold">Campaña:</span>
            <select
              class="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none"
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

        {/* Products Grid */}
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => {
            // Check if there are generated images in generatedImages (history) for this product
            const count = generatedImages.filter(img => 
              img.prompt.toLowerCase().includes(product.name.toLowerCase())
            ).length;
            
            const countText = count > 0 
              ? `${count} Anuncio${count > 1 ? 's' : ''}` 
              : '1 Anuncio'; // Keep "1 Anuncio" placeholder matching screenshot default if 0

            return (
              <div 
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product.id);
                  setSelectedProductForGen(product);
                }}
                class="glass-panel border border-white/10 rounded-3xl overflow-hidden cursor-pointer hover:shadow-xl hover:border-purple-500/30 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group h-full min-h-[320px]"
              >
                {/* Product Cover Image */}
                <div class="aspect-square w-full relative bg-slate-950 overflow-hidden rounded-t-3xl">
                  <img 
                    src={product.cover_image} 
                    alt={product.name} 
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  
                  {/* Category Badge */}
                  {product.category && (
                    <div class="absolute top-4 left-4">
                      <span class="px-2.5 py-1 rounded-full text-[9px] font-bold bg-black/60 border border-white/10 text-purple-300 uppercase tracking-wider">
                        {product.category}
                      </span>
                    </div>
                  )}

                  {/* Price Tag */}
                  <div class="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span class="text-xs font-extrabold text-white">${product.price}</span>
                  </div>
                </div>

                {/* Product Info */}
                <div class="p-5 flex-1 flex flex-col items-center justify-center text-center space-y-2">
                  <h4 class="font-bold text-slate-100 group-hover:text-purple-400 transition-colors line-clamp-1">
                    {product.name}
                  </h4>
                  
                  {/* Badge styled exactly like Ecom Magic AI */}
                  <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-purple-600/10 text-purple-400 border border-purple-500/20">
                    {countText}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Add Product Card (matching screenshot) */}
          <div 
            onClick={() => {
              setNewProdName('');
              setNewProdPrice('');
              setNewProdCategory('');
              setNewProdDescription('');
              setNewProdCoverImage('');
              setShowCreateModal(true);
            }}
            class="glass-panel border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/[0.02] rounded-3xl p-6 flex flex-col items-center justify-center min-h-[320px] text-center cursor-pointer transition-all duration-300 group"
          >
            <div class="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-purple-600 flex items-center justify-center text-slate-400 group-hover:text-white shadow-lg transition-all mb-4">
              <Plus class="w-6 h-6" />
            </div>
            <h4 class="font-bold text-slate-200 group-hover:text-purple-400 transition-colors">
              Agregar producto
            </h4>
            <p class="text-xs text-slate-500 mt-1.5 max-w-[200px] leading-relaxed">
              Crea un nuevo producto
            </p>
          </div>
        </div>

        {/* Create Product Modal inside AdGenPage */}
        {showCreateModal && (
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div class="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative max-h-[90vh] overflow-y-auto">
              <h3 class="text-xl font-bold mb-2">Agregar Nuevo Producto</h3>
              <p class="text-xs text-slate-400 mb-6">
                Esta información será leída por la IA para diseñar anuncios persuasivos y redactar copys.
              </p>
              
              <form onSubmit={handleCreateProductSubmit} class="space-y-5">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-400">Nombre del Producto</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Cobija piel de conejo" 
                    class="glass-input"
                    value={newProdName}
                    onChange={e => setNewProdName(e.target.value)}
                    required 
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-semibold text-slate-400">Precio de Venta ($)</label>
                    <div class="relative flex items-center">
                      <DollarSign class="w-4 h-4 text-slate-500 absolute left-3" />
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        class="glass-input pl-9 w-full"
                        value={newProdPrice}
                        onChange={e => setNewProdPrice(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-semibold text-slate-400">Categoría</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Hogar, Tecnología" 
                      class="glass-input"
                      value={newProdCategory}
                      onChange={e => setNewProdCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-400">Descripción Comercial (Dolores y Beneficios)</label>
                  <textarea 
                    rows="4"
                    placeholder="Ej: Cobija térmica ultrasuave ideal para invierno. Es antialérgica, ligera y lavable..." 
                    class="glass-input resize-none"
                    value={newProdDescription}
                    onChange={e => setNewProdDescription(e.target.value)}
                    required 
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-400">URL de Imagen de Portada</label>
                  <input 
                    type="text" 
                    placeholder="https://ejemplo.com/foto-producto.jpg" 
                    class="glass-input"
                    value={newProdCoverImage}
                    onChange={e => setNewProdCoverImage(e.target.value)}
                  />
                  <span class="text-[10px] text-slate-500">Deja vacío para usar una imagen genérica por defecto.</span>
                </div>
                
                <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button 
                    type="button" 
                    class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-all"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </button>
                  
                  <button 
                    type="submit"
                    disabled={isSavingProduct}
                    class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition-all disabled:opacity-50"
                  >
                    {isSavingProduct ? 'Guardando...' : 'Registrar Producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: Ad Generation Form (rendered when product is selected)
  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Back Button */}
      <button 
        type="button" 
        onClick={() => setSelectedProductForGen(null)}
        class="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-white/5 px-3.5 py-2 rounded-xl border border-white/5 hover:bg-white/10"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Volver al Catálogo</span>
      </button>

      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <Sparkles class="w-8 h-8 text-purple-400 animate-pulse" />
          <span>Generar Anuncio para: {selectedProductForGen.name}</span>
        </h2>
        <p class="text-slate-400 mt-1.5 text-xs">
          Crea banners publicitarios persuasivos combinando tu producto con plantillas ganadoras de referencia.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Controls - 8 Cols */}
        <form onSubmit={handleGenerate} class="lg:col-span-8 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <div class="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 class="font-bold text-base text-slate-200 flex items-center gap-2">
              <Sliders class="w-4 h-4 text-purple-400" />
              Configurar Anuncio Comercial
            </h3>
            
            {/* Project Selector inside form */}
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500 font-semibold">Proyecto:</span>
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

          {/* Hidden selected product logic */}
          <div class="bg-purple-950/20 border border-purple-500/10 rounded-2xl p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden border border-white/10">
                <img 
                  src={selectedProductForGen.cover_image} 
                  alt={selectedProductForGen.name} 
                  class="w-full h-full object-cover" 
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              </div>
              <div>
                <h4 class="text-sm font-bold text-slate-100">{selectedProductForGen.name}</h4>
                <p class="text-xs text-purple-300">${selectedProductForGen.price} · {selectedProductForGen.category || 'Sin Categoría'}</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setSelectedProductForGen(null)}
              class="text-xs text-slate-400 hover:text-white underline font-semibold"
            >
              Cambiar producto
            </button>
          </div>

          {/* Template Selection from Firebase */}
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label class="text-xs font-semibold text-slate-400 block">Selecciona la Plantilla de Referencia (Composición)</label>
              
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
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

            {/* Custom Template URL */}
            <div class="flex flex-col gap-1.5 pt-2">
              <label class="text-xs font-medium text-slate-500">O ingresa un enlace directo a otra imagen de referencia</label>
              <input
                type="text"
                placeholder="https://ejemplo.com/tu-propio-anuncio.jpg"
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
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Tamaño del Anuncio</label>
              <select class="glass-input bg-slate-950" value={format} onChange={e => setFormat(e.target.value)}>
                <option value="1:1">Cuadrado (1:1 - Feed)</option>
                <option value="9:16">Vertical (9:16 - Stories/Reels)</option>
                <option value="16:9">Horizontal (16:9 - Youtube/Display)</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Idioma de la Redacción</label>
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
            <label class="text-xs font-semibold text-slate-400">Instrucciones Adicionales (Opcional)</label>
            <input 
              type="text" 
              placeholder="Ej: Añadir luces doradas de fondo, resaltar detalles metálicos del producto..." 
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
                  <span>Procesando composición...</span>
                </>
              ) : (
                <>
                  <Wand2 class="w-4 h-4" />
                  <span>Generar Anuncio Profesional</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Preview Box - 4 Cols */}
        <div class="lg:col-span-4 space-y-6">
          <h3 class="font-bold text-lg text-slate-200">Previsualización del Anuncio</h3>
          
          <div class="glass-panel border border-white/10 rounded-3xl p-6 bg-slate-900/40 text-center flex flex-col items-center justify-center min-h-[400px]">
            {isGeneratingImages ? (
              <div class="space-y-4 animate-pulse">
                <RefreshCw class="w-12 h-12 mx-auto text-purple-400 animate-spin" />
                <h4 class="text-sm font-bold text-slate-200">Redactando y componiendo...</h4>
                <p class="text-xs text-slate-500 max-w-[200px] mx-auto">La IA está insertando el producto en el escenario de referencia y escribiendo titulares persuasivos.</p>
              </div>
            ) : successImages.length > 0 ? (
              <div class="space-y-4 w-full">
                <div class="rounded-2xl overflow-hidden border border-white/10 shadow-lg relative bg-slate-950 aspect-square">
                  <img src={successImages[0].image_url} alt="Result" class="w-full h-full object-cover" />
                </div>
                <div class="flex gap-2">
                  <a 
                    href={successImages[0].image_url}
                    download="creator-shopy-anuncio.webp"
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
          <h3 class="font-bold text-lg text-slate-200">Historial de Banners del Proyecto</h3>
          {generatedImages.length === 0 ? (
            <p class="text-sm text-slate-500">No hay banners generados para este proyecto.</p>
          ) : (
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {generatedImages.map(img => (
                <div 
                  key={img.id} 
                  class="glass-panel border border-white/10 rounded-2xl overflow-hidden bg-slate-950 group relative aspect-square"
                >
                  <img src={img.image_url} alt="Generated ad" class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                    <div class="flex justify-end">
                      <span class="bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">{img.model}</span>
                    </div>
                    <div class="flex justify-between items-center text-white">
                      <span class="text-[9px] truncate max-w-[80px] font-semibold">{img.prompt}</span>
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
