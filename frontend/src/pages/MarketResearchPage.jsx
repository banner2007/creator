import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { Sparkles, BrainCircuit, Lightbulb, Users2, ShieldQuestion, HelpCircle, RefreshCw, BarChart } from 'lucide-react';

export default function MarketResearchPage() {
  const {
    products,
    fetchProducts,
    runResearch,
    isResearching
  } = useStore();

  const [selectedProduct, setSelectedProduct] = useState('');
  const [activeTab, setActiveTab] = useState('product'); // product, angles, avatar
  
  // Cache generated reports in local state to prevent multiple requests
  const [reports, setReports] = useState({
    product: '',
    angles: '',
    avatar: ''
  });

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

  // Helper to convert simple markdown content to HTML elements (headers, bold, bullet points)
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <h4 key={idx} class="text-base font-bold text-purple-300 mt-4 mb-2">{trimmed.replace('###', '').trim()}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={idx} class="text-lg font-bold text-purple-400 mt-5 mb-3">{trimmed.replace('##', '').trim()}</h3>;
      }
      if (trimmed.startsWith('#')) {
        return <h2 key={idx} class="text-xl font-extrabold text-white mt-6 mb-4">{trimmed.replace('#', '').trim()}</h2>;
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        // Parse bold highlights inside lists
        const itemText = trimmed.substring(1).trim();
        return (
          <li key={idx} class="text-slate-300 text-sm ml-5 list-disc my-1 leading-relaxed">
            {parseBoldText(itemText)}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={idx} class="h-2"></div>;
      }
      return <p key={idx} class="text-slate-300 text-sm leading-relaxed my-2">{parseBoldText(trimmed)}</p>;
    });
  };

  const parseBoldText = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) return <strong key={i} class="text-white font-extrabold">{part}</strong>;
      return part;
    });
  };

  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <BrainCircuit class="w-8 h-8 text-purple-400" />
          <span>Investigación de Mercado & Copy IA</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Analiza tu producto con GPT-4o-mini de OpenAI para extraer los mejores ángulos de venta, la psicología de tu cliente ideal y la viabilidad del mercado.
        </p>
      </div>

      {/* Select Product */}
      <div class="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-end gap-6 justify-between">
        <div class="flex-1 flex flex-col gap-1.5 w-full">
          <label class="text-xs font-semibold text-slate-400">Selecciona el Producto a Analizar</label>
          <select
            class="glass-input bg-slate-950 font-medium"
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
          class="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-extrabold text-white rounded-xl shadow-lg shadow-purple-500/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0 w-full md:w-auto justify-center"
        >
          {isResearching ? (
            <>
              <RefreshCw class="w-4 h-4 animate-spin" />
              <span>Consultando a la IA...</span>
            </>
          ) : (
            <>
              <BrainCircuit class="w-4 h-4" />
              <span>Ejecutar Investigación</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs Menu */}
      <div class="flex border-b border-white/5 pb-0.5">
        <button
          onClick={() => setActiveTab('product')}
          class={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'product'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BarChart class="w-4 h-4" />
          <span>Análisis de Viabilidad</span>
        </button>

        <button
          onClick={() => setActiveTab('angles')}
          class={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'angles'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Lightbulb class="w-4 h-4" />
          <span>Ángulos de Venta (Copy)</span>
        </button>

        <button
          onClick={() => setActiveTab('avatar')}
          class={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'avatar'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users2 class="w-4 h-4" />
          <span>Perfil del Avatar</span>
        </button>
      </div>

      {/* Report View Panel */}
      <div class="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 bg-slate-900/25 min-h-[300px] relative overflow-hidden">
        {isResearching ? (
          <div class="absolute inset-0 bg-slate-950/20 backdrop-blur-xs flex flex-col items-center justify-center text-center p-8">
            <RefreshCw class="w-12 h-12 text-purple-400 animate-spin mb-4" />
            <h4 class="text-base font-bold text-slate-200">La Inteligencia Artificial está analizando tu producto</h4>
            <p class="text-xs text-slate-500 mt-1.5 max-w-sm">Deduciendo dolores, formulando copys y estructurando el reporte de mercado...</p>
          </div>
        ) : null}

        {reports[activeTab] ? (
          <div class="space-y-4 prose prose-invert max-w-none">
            {renderMarkdown(reports[activeTab])}
          </div>
        ) : (
          <div class="h-60 flex flex-col items-center justify-center text-center text-slate-500">
            {activeTab === 'product' && <BarChart class="w-12 h-12 stroke-1 mb-3 text-slate-600" />}
            {activeTab === 'angles' && <Lightbulb class="w-12 h-12 stroke-1 mb-3 text-slate-600" />}
            {activeTab === 'avatar' && <Users2 class="w-12 h-12 stroke-1 mb-3 text-slate-600" />}
            
            <h4 class="text-sm font-bold text-slate-400">Reporte no generado</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-[280px]">
              Selecciona tu producto en el panel superior y haz clic en "Ejecutar Investigación" (costo: 1 crédito).
            </p>
          </div>
        )}
      </div>

      {/* Credit warning */}
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <HelpCircle class="w-4 h-4 text-purple-400" />
        <span>Los reportes generados se guardan localmente hasta que cambies de producto o actualices la pestaña.</span>
      </div>
    </div>
  );
}
