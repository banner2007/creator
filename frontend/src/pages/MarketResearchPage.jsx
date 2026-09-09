import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { 
  Sparkles, 
  BrainCircuit, 
  Lightbulb, 
  Users2, 
  ShieldQuestion, 
  HelpCircle, 
  RefreshCw, 
  BarChart, 
  ShoppingCart, 
  Search, 
  Info, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

export default function MarketResearchPage() {
  const {
    products,
    fetchProducts,
    runResearch,
    isResearching,
    searchDropiProducts,
    importDropiProduct
  } = useStore();

  const [selectedProduct, setSelectedProduct] = useState('');
  const [activeTab, setActiveTab] = useState('product'); // product, angles, avatar, dropi
  
  // Cache generated reports in local state to prevent multiple requests
  const [reports, setReports] = useState({
    product: '',
    angles: '',
    avatar: ''
  });

  // Dropi catalog state
  const [dropiSearchQuery, setDropiSearchQuery] = useState('');
  const [dropiPage, setDropiPage] = useState(1);
  const [dropiProducts, setDropiProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingDropi, setIsLoadingDropi] = useState(false);
  const [dropiWhitelistError, setDropiWhitelistError] = useState('');
  const [importingId, setImportingId] = useState(null);
  const [importedStatus, setImportedStatus] = useState({}); // { dropiId: true }

  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset reports cache if product changes
  useEffect(() => {
    setReports({
      product: '',
      angles: '',
      avatar: ''
    });
  }, [selectedProduct]);

  const handleResearch = async () => {
    if (!selectedProduct) {
      alert('Por favor selecciona un producto.');
      return;
    }

    const report = await runResearch(activeTab, selectedProduct);
    if (report) {
      setReports(prev => ({
        ...prev,
        [activeTab]: report
      }));
    }
  };

  const handleDropiSearch = async (page = 1) => {
    setIsLoadingDropi(true);
    setDropiWhitelistError('');
    const result = await searchDropiProducts(dropiSearchQuery, page);
    if (result.status === 401 && result.data?.requiresWhitelist) {
      setDropiWhitelistError(result.data.ip);
      setDropiProducts([]);
    } else if (!result.ok) {
      alert(result.data?.error || 'Error al buscar productos en Dropi.');
    } else {
      if (result.data?.isSuccess) {
        setDropiProducts(result.data.objects || []);
        setDropiPage(page);
        // Estimate total pages: Dropi API does not return total count clearly when no_count is true, default to 10 page limit if not specified
        setTotalPages(result.data.count ? Math.ceil(result.data.count / 10) : 10);
      } else {
        alert(result.data?.message || 'No se pudieron recuperar los productos de Dropi.');
      }
    }
    setIsLoadingDropi(false);
  };

  const handleImportProduct = async (product) => {
    setImportingId(product.id);
    const result = await importDropiProduct({
      name: product.name,
      description: product.description || '',
      price: product.suggested_price || 0,
      cover_image: product.image || '',
      category: 'Dropi'
    });
    
    setImportingId(null);
    if (result.ok) {
      setImportedStatus(prev => ({ ...prev, [product.id]: true }));
      await fetchProducts();
      return result.data;
    } else {
      alert(result.data?.error || 'Error al importar el producto.');
      return null;
    }
  };

  const handleAnalyzeProduct = async (product) => {
    setImportingId(product.id);
    // 1. Check if product already exists locally by name
    let localProduct = products.find(p => p.name === product.name);
    
    // 2. If not, import it first
    if (!localProduct) {
      localProduct = await handleImportProduct(product);
    }
    
    // 3. Once imported, select it, swap tabs to viability, and run analysis
    if (localProduct) {
      setSelectedProduct(localProduct.id);
      setActiveTab('product');
      
      // Delay slightly to allow the product selector to update
      setTimeout(async () => {
        const report = await runResearch('product', localProduct.id);
        if (report) {
          setReports(prev => ({
            ...prev,
            product: report
          }));
        }
      }, 200);
    }
    setImportingId(null);
  };

  // Helper to convert simple markdown content to HTML elements (headers, bold, bullet points)
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <h4 key={idx} className="text-base font-bold text-purple-300 mt-4 mb-2">{trimmed.replace('###', '').trim()}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={idx} className="text-lg font-bold text-purple-400 mt-5 mb-3">{trimmed.replace('##', '').trim()}</h3>;
      }
      if (trimmed.startsWith('#')) {
        return <h2 key={idx} className="text-xl font-extrabold text-white mt-6 mb-4">{trimmed.replace('#', '').trim()}</h2>;
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const itemText = trimmed.substring(1).trim();
        return (
          <li key={idx} className="text-slate-300 text-sm ml-5 list-disc my-1 leading-relaxed">
            {parseBoldText(itemText)}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-2"></div>;
      }
      return <p key={idx} className="text-slate-300 text-sm leading-relaxed my-2">{parseBoldText(trimmed)}</p>;
    });
  };

  const parseBoldText = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) return <strong key={i} className="text-white font-extrabold">{part}</strong>;
      return part;
    });
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-purple-400" />
          <span>Investigación de Mercado & Copy IA</span>
        </h2>
        <p className="text-slate-400 mt-2 text-sm">
          Busca productos ganadores de Dropi, impórtalos a tu catálogo, y analízalos con GPT-4o-mini de OpenAI para extraer los mejores ángulos de venta y la psicología de tu cliente ideal.
        </p>
      </div>

      {/* Select Product - Hidden when Dropi tab is active */}
      {activeTab !== 'dropi' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-end gap-6 justify-between">
          <div className="flex-1 flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold text-slate-400">Selecciona el Producto a Analizar</label>
            <select
              className="glass-input bg-slate-950 font-medium"
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
            >
              <option value="">-- Elige un producto de tu catálogo --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleResearch}
            disabled={isResearching || !selectedProduct}
            className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-extrabold text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0 w-full md:w-auto justify-center"
          >
            {isResearching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Consultando a la IA...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                <span>Ejecutar Investigación</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 pb-0.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('product')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'product'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BarChart className="w-4 h-4" />
          <span>Análisis de Viabilidad</span>
        </button>

        <button
          onClick={() => setActiveTab('angles')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'angles'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Ángulos de Venta (Copy)</span>
        </button>

        <button
          onClick={() => setActiveTab('avatar')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'avatar'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Perfil del Avatar</span>
        </button>

        <button
          onClick={() => setActiveTab('dropi')}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'dropi'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Buscador Dropi</span>
        </button>
      </div>

      {/* Main View Display */}
      {activeTab === 'dropi' ? (
        <div className="space-y-6">
          {/* Dropi Whitelist Alert Banner */}
          {dropiWhitelistError && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-6 rounded-3xl flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <ShieldQuestion className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-300">Acceso Denegado por Dropi (IP no autorizada)</h4>
                  <p className="text-xs text-amber-400/80 leading-relaxed max-w-4xl">
                    Tu integración de Dropi está activa, pero no permite consultas desde la dirección IP de nuestro servidor. Por favor, agrega la siguiente dirección IP en la sección de integraciones de tu panel de Dropi (o solicita a soporte de Dropi que la habiliten):
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 sm:ml-9">
                <code className="bg-slate-950 px-3 py-2 rounded-xl text-xs font-mono font-bold text-purple-300 select-all border border-white/5">
                  {dropiWhitelistError}
                </code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(dropiWhitelistError);
                    alert('¡Dirección IP copiada al portapapeles!');
                  }}
                  className="text-xs px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-all font-bold border border-white/5"
                >
                  Copiar IP
                </button>
              </div>
            </div>
          )}

          {/* Search Inputs */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar productos en Dropi (ej. citrato, masajeador)..."
                className="glass-input pl-11 bg-slate-950 font-medium w-full"
                value={dropiSearchQuery}
                onChange={e => setDropiSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleDropiSearch(1); }}
              />
            </div>
            <button
              onClick={() => handleDropiSearch(1)}
              disabled={isLoadingDropi}
              className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-extrabold text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center"
            >
              {isLoadingDropi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Buscar Productos</span>
                </>
              )}
            </button>
          </div>

          {/* Product Grid */}
          {isLoadingDropi && dropiProducts.length === 0 ? (
            <div className="glass-panel border border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mb-4" />
              <h4 className="text-sm font-bold text-slate-300">Buscando en el catálogo de Dropi</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">Esto puede tardar un momento dependiendo de la conexión...</p>
            </div>
          ) : dropiProducts.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {dropiProducts.map(product => (
                  <div key={product.id} className="glass-panel border border-white/10 rounded-3xl p-5 flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 relative group overflow-hidden bg-slate-900/10">
                    <div>
                      {/* Product Image */}
                      <div className="w-full aspect-square rounded-2xl bg-slate-950 overflow-hidden relative border border-white/5 mb-4">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-xs">
                            <ShoppingCart className="w-8 h-8 text-slate-700 mb-1 stroke-1" />
                            <span>Sin imagen</span>
                          </div>
                        )}
                        {importedStatus[product.id] && (
                          <div className="absolute top-2.5 right-2.5 bg-purple-500/90 text-white p-1.5 rounded-full backdrop-blur-xs flex items-center justify-center border border-purple-400">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Product Name */}
                      <h4 className="text-sm font-bold text-white line-clamp-2 leading-relaxed" title={product.name}>
                        {product.name}
                      </h4>

                      {/* Specs */}
                      <div className="space-y-1.5 mt-3 pt-3 border-t border-white/5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Precio Sugerido:</span>
                          <span className="font-extrabold text-purple-300">${Number(product.suggested_price || 0).toLocaleString()}</span>
                        </div>
                        {product.price && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Precio Proveedor:</span>
                            <span className="font-bold text-slate-300">${Number(product.price).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Disponibilidad:</span>
                          <span className={`font-bold ${product.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {product.stock || 0} unidades
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleImportProduct(product)}
                        disabled={importingId === product.id || importedStatus[product.id]}
                        className="py-2.5 bg-slate-950 hover:bg-slate-900 disabled:opacity-75 disabled:hover:bg-slate-950 rounded-xl text-xs font-bold text-slate-300 border border-white/5 flex items-center justify-center gap-1.5 transition-all"
                      >
                        {importingId === product.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                        ) : importedStatus[product.id] ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <ShoppingCart className="w-3.5 h-3.5" />
                        )}
                        <span>{importedStatus[product.id] ? 'Importado' : 'Importar'}</span>
                      </button>
                      <button
                        onClick={() => handleAnalyzeProduct(product)}
                        disabled={importingId === product.id}
                        className="py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-500/10 hover:shadow-purple-500/20"
                      >
                        <BrainCircuit className="w-3.5 h-3.5" />
                        <span>Analizar IA</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-white/5">
                  <button
                    onClick={() => handleDropiSearch(dropiPage - 1)}
                    disabled={dropiPage === 1 || isLoadingDropi}
                    className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-white/5 disabled:opacity-30 rounded-xl text-slate-300 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-400">Página {dropiPage} de {totalPages}</span>
                  <button
                    onClick={() => handleDropiSearch(dropiPage + 1)}
                    disabled={dropiPage === totalPages || isLoadingDropi}
                    className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-white/5 disabled:opacity-30 rounded-xl text-slate-300 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel border border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center text-center text-slate-500">
              <ShoppingCart className="w-12 h-12 stroke-1 mb-3 text-slate-600" />
              <h4 className="text-sm font-bold text-slate-400">Catálogo de Dropi</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                Ingresa una palabra clave en la barra superior para buscar productos en tiempo real y empezar a utilizarlos.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Report View Panel for AI Analysis tabs */
        <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 bg-slate-900/25 min-h-[300px] relative overflow-hidden">
          {isResearching ? (
            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs flex flex-col items-center justify-center text-center p-8 z-10">
              <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mb-4" />
              <h4 className="text-base font-bold text-slate-200">La Inteligencia Artificial está analizando tu producto</h4>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm">Deduciendo dolores, formulando copys y estructurando el reporte de mercado...</p>
            </div>
          ) : null}

          {reports[activeTab] ? (
            <div className="space-y-4 prose prose-invert max-w-none">
              {renderMarkdown(reports[activeTab])}
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center text-slate-500">
              {activeTab === 'product' && <BarChart className="w-12 h-12 stroke-1 mb-3 text-slate-600" />}
              {activeTab === 'angles' && <Lightbulb className="w-12 h-12 stroke-1 mb-3 text-slate-600" />}
              {activeTab === 'avatar' && <Users2 className="w-12 h-12 stroke-1 mb-3 text-slate-600" />}
              
              <h4 className="text-sm font-bold text-slate-400">Reporte no generado</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                Selecciona tu producto en el panel superior y haz clic en "Ejecutar Investigación" (costo: 1 crédito).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Credit warning */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <HelpCircle className="w-4 h-4 text-purple-400" />
        <span>Los reportes generados se guardan localmente hasta que cambies de producto o actualices la pestaña.</span>
      </div>
    </div>
  );
}
