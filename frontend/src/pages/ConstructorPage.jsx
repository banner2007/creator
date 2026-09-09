import React, { useState, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, RefreshCcw, Mic, LifeBuoy,
  Paintbrush, Upload, ShoppingBag, Users, Gift, CreditCard, FileText,
  Settings, Globe, Radio, BarChart2, Moon, Sun, ExternalLink,
  MessageSquare, TrendingUp, ArrowUpRight, Plus, Trash2, ChevronUp,
  ChevronDown, X, Save, ArrowRight, Monitor, Smartphone, Layers,
  Image as ImageIcon, Sparkles, CheckCircle, Layout, LayoutGrid, Star,
  Search, ArrowLeft, Bold, Italic, Underline, Strikethrough, AlignLeft,
  AlignCenter, AlignRight, AlignJustify, Link2, AlertTriangle, Check
} from 'lucide-react';

// ---------------------------------------------------------------------------
// DropPage color palette
// ---------------------------------------------------------------------------
const ACCENT = '#4DBEAA';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const MOCK_KPI = [
  { label: 'Pedidos', value: '0', icon: <ShoppingCart className="w-5 h-5" />, iconBg: 'bg-blue-100', iconColor: 'text-blue-500', change: '0.0%', positive: true },
  { label: 'Ventas', value: '0 COP', icon: <span className="text-green-500 font-bold text-lg">$</span>, iconBg: 'bg-green-100', iconColor: 'text-green-500', change: '0.0%', positive: true },
  { label: 'Carritos abandonados', value: '0', icon: <ShoppingBag className="w-5 h-5" />, iconBg: 'bg-orange-100', iconColor: 'text-orange-400', change: '0.0%', positive: true },
  { label: 'Tasa de conversion', value: '0.0%', icon: <TrendingUp className="w-5 h-5" />, iconBg: 'bg-purple-100', iconColor: 'text-purple-500', change: '0.0%', positive: true },
];

const DATE_FILTERS = ['Hoy', 'Ayer', '7 días', '30 días', 'Este mes', 'Mes pasado'];

const MOCK_TEMPLATES = [
  { id: 't1', name: 'Hero Full Width', rows: [{ id: 'r1', columns: 1, height: 400, label: 'Banner Principal' }], thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400&h=220', premium: false },
  { id: 't2', name: 'Beneficios 2 Columnas', rows: [{ id: 'r1', columns: 1, height: 300, label: 'Hero' }, { id: 'r2', columns: 2, height: 240, label: 'Beneficios' }], thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400&h=220', premium: false },
  { id: 't3', name: '3 Columnas Features', rows: [{ id: 'r1', columns: 1, height: 300, label: 'Banner' }, { id: 'r2', columns: 3, height: 200, label: 'Features' }, { id: 'r3', columns: 1, height: 180, label: 'CTA' }], thumbnail: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=400&h=220', premium: false },
];

function generateId() { return Math.random().toString(36).substring(2, 9); }

// ---------------------------------------------------------------------------
// Sidebar navigation definition
// ---------------------------------------------------------------------------
const NAV_PRINCIPAL = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
  { id: 'recompras', label: 'Recompras', icon: RefreshCcw },
  { id: 'ventas-voz', label: 'Ventas de voz', icon: Mic },
  { id: 'rescate', label: 'Centro de Rescate', icon: LifeBuoy },
  { id: 'disenar', label: 'Diseñar tienda', icon: Paintbrush },
  { id: 'claude', label: 'Sube tu diseño de Claude', icon: Upload },
];

const NAV_MARKETING = [
  { id: 'carritos', label: 'Carritos abandonados', icon: ShoppingBag },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'referidos', label: 'Referidos', icon: Gift },
];

const NAV_CONFIG = [
  { id: 'checkout', label: 'Checkout', icon: CreditCard },
  { id: 'politicas', label: 'Políticas', icon: FileText },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
  { id: 'dominio', label: 'Dominio', icon: Globe },
  { id: 'pixeles', label: 'Píxeles', icon: Radio },
  { id: 'analiticas', label: 'Analíticas', icon: BarChart2 },
];

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function SimpleLineChart({ data, label }) {
  const w = 700, h = 180;
  const pad = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const max = Math.max(...data.map(d => d.value), 4);
  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: pad.top + chartH - (d.value / max) * chartH,
    label: d.label,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${pad.top + chartH} L ${points[0].x} ${pad.top + chartH} Z`;

  const yTicks = [0, 1, 2, 3, 4].filter(v => v <= max);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 180 }}>
      {yTicks.map(v => {
        const y = pad.top + chartH - (v / max) * chartH;
        return (
          <g key={v}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{v}</text>
          </g>
        );
      })}
      {points.length > 1 && <path d={areaD} fill={ACCENT} fillOpacity="0.08" />}
      {points.length > 1 && <path d={pathD} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={ACCENT} strokeWidth="2" />
          <text x={p.x} y={pad.top + chartH + 20} textAnchor="middle" fontSize="11" fill="#9ca3af">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

function KpiCard({ item }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-sm text-gray-500 font-medium">{item.label}</span>
        <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center ${item.iconColor}`}>{item.icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{item.value}</div>
      <div className="flex items-center gap-1.5 text-xs">
        <ArrowUpRight className={`w-3.5 h-3.5 ${item.positive ? 'text-green-500' : 'text-red-400'}`} />
        <span className={`font-semibold ${item.positive ? 'text-green-500' : 'text-red-400'}`}>{item.change}</span>
        <span className="text-gray-400">vs periodo anterior</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function ConstructorPage() {
  const [activeSection, setActiveSection] = useState('productos');
  const [darkMode, setDarkMode] = useState(true);
  
  // Dashboard state
  const [dateFilter, setDateFilter] = useState('Hoy');

  // Designer state
  const [designStep, setDesignStep] = useState('builder');
  const [structureName, setStructureName] = useState('');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [rows, setRows] = useState([{ id: generateId(), columns: 1, height: 400, label: 'Bloque 1' }]);
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState('todas');
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [saveStatus, setSaveStatus] = useState('idle');
  const fileInputRef = useRef(null);

  // ---- row helpers ----
  const addRow = useCallback(() => setRows(prev => [...prev, { id: generateId(), columns: 1, height: 300, label: `Bloque ${prev.length + 1}` }]), []);
  const updateRow = useCallback((id, changes) => setRows(prev => prev.map(r => r.id === id ? { ...r, ...changes } : r)), []);
  const deleteRow = useCallback((id) => setRows(prev => prev.filter(r => r.id !== id)), []);
  const moveRowUp = useCallback((index) => { if (index === 0) return; setRows(prev => { const n = [...prev]; [n[index - 1], n[index]] = [n[index], n[index - 1]]; return n; }); }, []);
  const moveRowDown = useCallback((index) => setRows(prev => { if (index >= prev.length - 1) return prev; const n = [...prev]; [n[index], n[index + 1]] = [n[index + 1], n[index]]; return n; }), []);

  const applyTemplate = useCallback((t) => {
    setRows(t.rows.map(r => ({ ...r, id: generateId() })));
    if (!structureName) setStructureName(t.name);
  }, [structureName]);

  const handleReferenceUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingRef(true);
    const url = URL.createObjectURL(file);
    setReferenceImageUrl(url);
    setIsUploadingRef(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleSave = useCallback(async () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    await new Promise(r => setTimeout(r, 900));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  }, [saveStatus]);

  const filteredTemplates = MOCK_TEMPLATES.filter(t =>
    galleryFilter === 'todas' ? true :
    galleryFilter === 'premium' ? t.premium : false
  );

  // ---- sidebar bg colors ----
  const sidebarBg = darkMode ? '#0d1117' : '#1a1f2e';
  const sidebarText = '#c9d1d9';

  const renderNavItem = (item) => {
    const active = activeSection === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => setActiveSection(item.id)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5 text-left text-xs font-medium transition-all"
        style={{
          backgroundColor: active ? '#ffffff15' : 'transparent',
          color: active ? '#ffffff' : sidebarText,
          fontWeight: active ? 600 : 400,
        }}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  const renderMain = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardView dateFilter={dateFilter} setDateFilter={setDateFilter} />;
      case 'productos': return <ProductosView />;
      case 'disenar': return (
        <DesignerView
          structureName={structureName} setStructureName={setStructureName}
          bgColor={bgColor} setBgColor={setBgColor}
          referenceImageUrl={referenceImageUrl} setReferenceImageUrl={setReferenceImageUrl}
          isUploadingRef={isUploadingRef} fileInputRef={fileInputRef}
          handleReferenceUpload={handleReferenceUpload}
          rows={rows} addRow={addRow} updateRow={updateRow} deleteRow={deleteRow}
          moveRowUp={moveRowUp} moveRowDown={moveRowDown}
          designStep={designStep} setDesignStep={setDesignStep}
          galleryFilter={galleryFilter} setGalleryFilter={setGalleryFilter}
          filteredTemplates={filteredTemplates} applyTemplate={applyTemplate}
          previewDevice={previewDevice} setPreviewDevice={setPreviewDevice}
          saveStatus={saveStatus} handleSave={handleSave}
        />
      );
      default: return <PlaceholderView label={NAV_PRINCIPAL.concat(NAV_MARKETING, NAV_CONFIG).find(n => n.id === activeSection)?.label || activeSection} />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 text-gray-800">

      {/* SIDEBAR */}
      <aside
        className="w-[220px] flex flex-col shrink-0 overflow-y-auto"
        style={{ backgroundColor: sidebarBg }}
      >
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight tracking-tight">DropPage</p>
            <p className="text-[8px] uppercase tracking-wider font-semibold" style={{ color: '#8b5cf6' }}>Funnels de alta conversion</p>
          </div>
        </div>

        {/* PRINCIPAL */}
        <div className="px-4 pt-2 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-gray-500">Principal</p>
          {NAV_PRINCIPAL.map(renderNavItem)}
        </div>

        {/* MARKETING */}
        <div className="px-4 pt-4 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-gray-500">Marketing</p>
          {NAV_MARKETING.map(renderNavItem)}
        </div>

        {/* CONFIGURACIÓN */}
        <div className="px-4 pt-4 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-gray-500">Configuracion</p>
          {NAV_CONFIG.map(renderNavItem)}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5 text-left text-xs font-medium transition-all text-gray-400 hover:text-white"
          >
            <Moon className="w-4 h-4 shrink-0" />
            <span>Modo noche</span>
          </button>
        </div>

        {/* Bottom CTA buttons */}
        <div className="mt-auto px-4 pb-6 space-y-2 pt-6">
          <button onClick={() => window.open('https://optimedia-studio.web.app', '_blank')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90" style={{ backgroundColor: ACCENT }}>
            <ExternalLink className="w-3.5 h-3.5" />
            Ver mi tienda
          </button>
          <button onClick={() => alert('Abriendo interfaz de Chateando...')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all text-white hover:opacity-90" style={{ backgroundColor: '#3b2f5b' }}>
            <MessageSquare className="w-3.5 h-3.5" />
            Ir a Chateando
          </button>
          <button onClick={() => window.location.href = 'https://www.estrategasia.com'} className="w-full flex items-center justify-center gap-2 pt-4 text-[11px] font-medium text-gray-400 hover:text-white transition-all">
            <ArrowLeft className="w-3 h-3" />
            Volver a ESTRATEGASIA
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#fafafa]">
        {renderMain()}

        {/* MASCOT (Octavio) */}
        {(activeSection === 'dashboard' || activeSection === 'productos') && (
          <div className="absolute bottom-6 right-8 z-50 flex flex-col items-end gap-2 pointer-events-none drop-shadow-xl">
            <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-lg text-sm font-semibold text-gray-700 pointer-events-auto cursor-pointer hover:shadow-xl transition-all">
              ¿Quieres que Octavio te ayude?
            </div>
            <div className="w-24 h-24 mr-2 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-400 border-4 border-white flex items-center justify-center text-4xl shadow-2xl relative overflow-hidden pointer-events-auto">
              <span className="absolute text-5xl mt-4">🐙</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard View
// ---------------------------------------------------------------------------
function DashboardView({ dateFilter, setDateFilter }) {
  const chartData = [{ label: '28 de ago', value: 0 }];
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{dateFilter}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600">
            <Globe className="w-3.5 h-3.5 text-gray-400" />
            Colombia — Bogotá (UTC-5)
            <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            {DATE_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className="px-4 py-1.5 rounded-md text-xs font-medium transition-all"
                style={dateFilter === f ? { backgroundColor: 'white', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#6b7280' }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6 flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-5">
          {MOCK_KPI.map((item, i) => <KpiCard key={i} item={item} />)}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm col-span-2">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Ventas por día</h3>
            <SimpleLineChart data={chartData} label="Ventas" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Pedidos por día</h3>
            <div className="text-center py-8 text-gray-300 text-sm">Sin datos aún</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Top productos</h3>
            <div className="text-center py-8 text-gray-300 text-sm">Sin datos aún</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Productos View (List + Create)
// ---------------------------------------------------------------------------
function ProductosView() {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'
  const [filter, setFilter] = useState('Todos');

  if (viewMode === 'create') {
    return <NuevoProductoView onBack={() => setViewMode('list')} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">Productos</h1>
          <p className="text-sm text-[#6b7280] mt-1">Gestiona el catalogo de tu tienda</p>
        </div>
        <button 
          onClick={() => setViewMode('create')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm" 
          style={{ backgroundColor: ACCENT }}
        >
          <Plus className="w-4 h-4" /> Agregar producto
        </button>
      </div>

      <div className="p-8 flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-teal-400 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            {['Todos', 'Activos', 'Borradores'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                style={filter === f ? { backgroundColor: 'white', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#6b7280' }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center justify-center min-h-[400px] shadow-sm">
          <div className="w-16 h-16 mb-4 text-gray-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <p className="text-gray-400 font-medium text-[15px]">No se encontraron productos</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NEW: Nuevo Producto Form View
// ---------------------------------------------------------------------------
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <label className="block text-xs font-semibold text-gray-800 mb-1.5">{children}</label>
);

const Input = (props) => (
  <input 
    {...props} 
    className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#4DBEAA] transition-colors ${props.className || ''}`} 
  />
);

function NuevoProductoView({ onBack }) {
  // Form State
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  
  // New Variant State
  const [newVar, setNewVar] = useState({ name: '', value: '', price: '', stock: '', idProd: '', idVar: '' });

  const addVariant = () => {
    if(newVar.name && newVar.value) {
      setVariants([...variants, { ...newVar, id: generateId() }]);
      setNewVar({ name: '', value: '', price: '', stock: '', idProd: '', idVar: '' });
    }
  };

  const removeVariant = (id) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const handleCreateProduct = () => {
    alert(`Producto "${title || 'Sin título'}" guardado correctamente.`);
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">Nuevo producto</h1>
            <p className="text-[13px] text-gray-500">Completa la informacion del producto</p>
          </div>
        </div>
        <button 
          onClick={handleCreateProduct}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm flex items-center gap-2" 
          style={{ backgroundColor: ACCENT }}
        >
          <Save className="w-4 h-4" />
          Crear producto
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        <div className="max-w-3xl w-full space-y-5 pb-12">
          
          {/* Card 1: General */}
          <Card className="space-y-5">
            <div>
              <Label>Título</Label>
              <Input placeholder="Ej. Camiseta deportiva premium" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            
            <div>
              <Label>Descripción</Label>
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col focus-within:border-[#4DBEAA] transition-colors">
                {/* Mock Toolbar */}
                <div className="bg-gray-50 border-b border-gray-200 p-1.5 flex gap-1 flex-wrap">
                  {[Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link2, ImageIcon].map((Icon, i) => (
                    <button key={i} className="p-1.5 rounded hover:bg-gray-200 text-gray-500">
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                <textarea 
                  rows="5" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 text-sm text-gray-800 focus:outline-none resize-y min-h-[100px]" 
                />
              </div>
            </div>

            <div>
              <Label>Descripción corta</Label>
              <Input placeholder="Breve descripcion para Youtube y SEO" value={shortDesc} onChange={e => setShortDesc(e.target.value)} />
            </div>
          </Card>

          {/* Card 2: Multimedia */}
          <Card>
            <h3 className="text-[13px] font-bold text-gray-900 mb-3">Multimedia</h3>
            <div 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={(e) => { e.preventDefault(); const files = e.dataTransfer.files; if(files?.length) { const urls = Array.from(files).map(f => URL.createObjectURL(f)); setImages(prev => [...prev, ...urls]); } }}
              onClick={() => document.getElementById('file-upload').click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-teal-400/50 cursor-pointer transition-colors group"
            >
              <ImageIcon className="w-10 h-10 text-gray-300 mb-3 group-hover:text-teal-400/70" />
              <p className="text-sm font-semibold text-gray-700">Arrastra imagenes aqui o haz clic para subir</p>
              <p className="text-xs text-gray-400 mt-1.5">PNG, JPG o WEBP. Puedes seleccionar varios archivos.</p>
              <input 
                id="file-upload" 
                type="file" 
                multiple 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
                onChange={(e) => {
                  if(e.target.files?.length) {
                    const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f));
                    setImages(prev => [...prev, ...urls]);
                  }
                }} 
              />
            </div>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group/img">
                    <img src={img} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setImages(images.filter((_, i) => i !== idx)); }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Card 3: Variantes */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13px] font-bold text-gray-900">Variantes</h3>
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#4DBEAA] text-[#4DBEAA] bg-[#4DBEAA]/5 hover:bg-[#4DBEAA]/10 transition-colors flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Generar combinaciones (matrix)
              </button>
            </div>
            
            <div className="flex gap-2 mb-3">
              <Input placeholder="Nombre" className="flex-[1.5]" value={newVar.name} onChange={e => setNewVar({...newVar, name: e.target.value})} />
              <Input placeholder="Valor (ej...)" className="flex-[1.5]" value={newVar.value} onChange={e => setNewVar({...newVar, value: e.target.value})} />
              <Input placeholder="Precio" className="w-20" value={newVar.price} onChange={e => setNewVar({...newVar, price: e.target.value})} />
              <Input placeholder="Stock" className="w-16" value={newVar.stock} onChange={e => setNewVar({...newVar, stock: e.target.value})} />
              <Input placeholder="ID Prod." className="w-24" value={newVar.idProd} onChange={e => setNewVar({...newVar, idProd: e.target.value})} />
              <Input placeholder="ID Var." className="w-24" value={newVar.idVar} onChange={e => setNewVar({...newVar, idVar: e.target.value})} />
              <button onClick={addVariant} className="px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-all hover:opacity-90 flex items-center gap-1" style={{ backgroundColor: ACCENT }}>
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
            
            <p className="text-[11px] text-gray-500 mb-4 leading-tight">
              El <strong>Producto Dropi</strong> (sólo se asocia un ID de producto Dropi si el producto cuenta con el publicado por variantes), El <strong>Variante Dropi</strong> será el proporcional del mismo producto. Revisa los IDs.
            </p>
            
            {variants.length === 0 ? (
              <div className="border border-gray-100 bg-gray-50 rounded-lg p-6 text-center text-sm text-gray-400">
                No hay variantes agregadas
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {variants.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 bg-white border-b border-gray-100 last:border-0 text-sm">
                    <div className="flex-1 font-medium">{v.name}: {v.value}</div>
                    <div className="w-20 text-gray-500">${v.price || '0'}</div>
                    <div className="w-16 text-gray-500">{v.stock || '0'}</div>
                    <button onClick={() => removeVariant(v.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Card 4: Pais y Estado */}
          <Card className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>País</Label>
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#4DBEAA] appearance-none">
                  <option>Sin definir (moneda de tienda)</option>
                  <option>Colombia (COP)</option>
                  <option>México (MXN)</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1.5">Define la moneda y mercado de ofertas para este producto</p>
              </div>
              <div>
                <Label>Estado</Label>
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#4DBEAA] appearance-none">
                  <option>Activo</option>
                  <option>Borrador</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-[#4DBEAA] focus:ring-[#4DBEAA]" />
                <div>
                  <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Producto destacado
                  </span>
                </div>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-[#4DBEAA] focus:ring-[#4DBEAA]" />
                <div>
                  <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500" /> Confirma IA
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">Habilita que las compras de este producto usen el flujo de confirmación automática (BETA)</p>
                </div>
              </label>
            </div>
          </Card>

          {/* Card 5: Recompras */}
          <Card>
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-[#4DBEAA] focus:ring-[#4DBEAA]" />
              <div>
                <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">Recompras Automáticas</span>
                <p className="text-[11px] text-gray-500 mt-0.5">Ofrece a tus clientes la opción de suscribirse y pedir envíos de forma mensual/semanal</p>
              </div>
            </label>
          </Card>

          {/* Card 6: Precios */}
          <Card>
            <h3 className="text-[13px] font-bold text-gray-900 mb-4">Precios</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio de venta</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input type="number" placeholder="0" className="pl-7" />
                </div>
              </div>
              <div>
                <Label>Precio de comparación</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input type="number" placeholder="Precio antes" className="pl-7" />
                </div>
              </div>
              <div>
                <Label>Costo por artículo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input type="number" placeholder="Costo" className="pl-7" />
                </div>
              </div>
              <div>
                <Label>Mínimo envío aparte (cobro por envío)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input type="number" placeholder="Ej: 15000" className="pl-7" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
              Sólo aplica si fijas Mínimo de envío (y el total es menor al fijado). Ejemplo: Fijas $50.000 &gt; el cliente compra un producto Cuesta: $20.000 &lt; $50.000 (aplica Mínimo), se cobra Envío de $15.000, Total pagado $35.000 (20k prod. + 15k envío).
            </p>
          </Card>

          {/* Card 7: Inventario */}
          <Card>
            <h3 className="text-[13px] font-bold text-gray-900 mb-4">Inventario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                <Input placeholder="SKU del producto" />
              </div>
              <div>
                <Label>ID Producto Dropi</Label>
                <Input placeholder="ID en Dropi" />
              </div>
            </div>
          </Card>

          {/* Card 8: Proveedor */}
          <Card>
            <h3 className="text-[13px] font-bold text-gray-900 mb-1.5">Proveedor de envíos</h3>
            <p className="text-[11px] text-gray-500 mb-4">Ajusta desde dónde se procesa este (Dropi y Alidropship (Peru) puedes convivir en tu tienda)</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-[#4DBEAA] transition-colors">
                <input type="radio" name="provider" className="text-[#4DBEAA] focus:ring-[#4DBEAA]" defaultChecked />
                <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div> Dropi
                </span>
              </label>
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-[#4DBEAA] transition-colors">
                <input type="radio" name="provider" className="text-[#4DBEAA] focus:ring-[#4DBEAA]" />
                <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div> Alidropship (Peru)
                </span>
              </label>
            </div>
          </Card>

          {/* Card 9: Etiquetas */}
          <Card>
            <Label>Etiquetas</Label>
            <Input placeholder="Escribe y presiona Enter..." />
          </Card>

          {/* Card 10: Grupo Proveedor */}
          <Card>
            <Label>Grupo de proveedor</Label>
            <p className="text-[11px] text-gray-500 mb-3">Si tienes varios vendors en Dropi, con una sola Dropi page, ponle el mismo string (texto) a todos tus productos de ese proveedor y listo, filtra en tus cupones, etc... comprobados.</p>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Ej. Proveedor Zapatos La 53... -- Enter para guardar" className="pl-9" />
            </div>
          </Card>

          {/* Card 11: Combo */}
          <Card>
            <h3 className="text-[13px] font-bold text-gray-900 mb-1.5">Combo desarmable</h3>
            <p className="text-[11px] text-gray-500 mb-4">Si este producto es un combo, agrega los productos individuales que lo componen. Al sincronizar el Dropi se mandarán sus componentes (y no el combo como tal) para enviar en Dropi. El precio que se cobra al cliente sigue siendo el precio de este combo, no la suma de sus componentes.</p>
            <div className="border border-gray-100 bg-gray-50 rounded-lg p-6 text-center text-sm text-gray-400 mb-3">
              No hay componentes agregados
            </div>
            <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex justify-center items-center gap-1.5">
              <Plus className="w-4 h-4" /> Agregar componente
            </button>
          </Card>

          {/* Card 12: WhatsApp */}
          <Card>
            <label className="flex items-start gap-2.5 cursor-pointer group mb-3">
              <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-[#4DBEAA] focus:ring-[#4DBEAA]" defaultChecked />
              <div>
                <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">Mensajes por WhatsApp</span>
                <p className="text-[11px] text-gray-500 mt-0.5">Dejar que sistema de Chateando envíe por este producto, capos/recus (Toggle disparar WhatsApp por producto en Chateando). Este toggle está BETA aun. Y el campo se ignora.</p>
              </div>
            </label>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[12px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>No hay números WhatsApp conectados. Ve a tu Carrera para añadir <strong>Chateando → Configuración → Números</strong></span>
            </div>
          </Card>

          {/* Card 13: Formulario */}
          <Card>
            <h3 className="text-[13px] font-bold text-gray-900 mb-1.5">Formulario de pedido</h3>
            <p className="text-[11px] text-gray-500 mb-4">Donde completará el usuario sus datos para que se le envíe en la landing de este producto.</p>
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="radio" name="form_type" className="mt-0.5 text-[#4DBEAA] focus:ring-[#4DBEAA]" defaultChecked />
                <div>
                  <span className="text-sm font-medium text-gray-800">En una página aparte (Ej: 2. checkout.com)</span>
                  <span className="text-[11px] text-gray-500 ml-1">(El botón lleva al cliente a la página de checkout)</span>
                </div>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="radio" name="form_type" className="mt-0.5 text-[#4DBEAA] focus:ring-[#4DBEAA]" />
                <div>
                  <span className="text-sm font-medium text-gray-800">Dentro de la misma landing</span>
                  <span className="text-[11px] text-gray-500 ml-1">— (Se abrirá un popup / Se renderiza al final de la landing, el dev lo maquetará que maneje eso solo "Checkout Rápido", y entraremos en su elementación)</span>
                </div>
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-3 bg-gray-50 p-2 rounded">
              Código post-checkout para encuesta/post-venta: instalado en una y/o págna aparte checkout.
            </p>
          </Card>

          {/* Card 14: Pixeles */}
          <Card>
            <h3 className="text-[13px] font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-red-500" /> Píxeles de seguimiento
            </h3>
            <p className="text-[11px] text-gray-500 mb-3">Cuando asignes un pixel a tu tienda el (y) a este producto (ViewContent / AddToCart / InitiateCheckout / Purchase) se rastrearán pixel. Ya tienes 10/10 en uso. (Se asignan a nivel del país del producto, o los globales).</p>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[12px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>No has configurado píxeles. Agrégalos en <strong>Píxeles y seguimiento</strong> (menú lateral).</span>
            </div>
          </Card>

          {/* Footer Action */}
          <div className="flex justify-end pt-4">
            <button onClick={handleCreateProduct} className="px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 shadow-sm flex items-center gap-2" style={{ backgroundColor: ACCENT }}>
              <Save className="w-4 h-4" />
              Crear producto
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Designer View (Construct/Builder)
// ---------------------------------------------------------------------------
function DesignerView({
  structureName, setStructureName, bgColor, setBgColor,
  referenceImageUrl, setReferenceImageUrl, isUploadingRef, fileInputRef, handleReferenceUpload,
  rows, addRow, updateRow, deleteRow, moveRowUp, moveRowDown,
  designStep, setDesignStep, galleryFilter, setGalleryFilter,
  filteredTemplates, applyTemplate, previewDevice, setPreviewDevice,
  saveStatus, handleSave
}) {
  const RowBlock = ({ row, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }) => (
    <div className="group relative bg-gray-50 border border-gray-200 hover:border-teal-400/60 rounded-xl p-4 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: ACCENT + '20', color: ACCENT }}>{index + 1}</span>
          <input value={row.label} onChange={e => onUpdate(row.id, { label: e.target.value })}
            className="bg-transparent text-xs font-semibold text-gray-700 border-b border-transparent hover:border-gray-300 focus:border-teal-500 focus:outline-none transition-all px-1 py-0.5 max-w-[120px]"
          />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onMoveUp(index)} disabled={index === 0} className="p-1 rounded hover:bg-gray-200 text-gray-400 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => onMoveDown(index)} disabled={index === total - 1} className="p-1 rounded hover:bg-gray-200 text-gray-400 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
          <button onClick={() => onDelete(row.id)} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-bold uppercase text-gray-400">Columnas:</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(n => (
            <button key={n} onClick={() => onUpdate(row.id, { columns: n })}
              className={`w-6 h-6 rounded text-xs font-bold transition-all ${row.columns === n ? 'text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-teal-400'}`}
              style={row.columns === n ? { backgroundColor: ACCENT } : {}}
            >{n}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase text-gray-400 shrink-0">Alto:</span>
        <input type="range" min={80} max={700} step={20} value={row.height} onChange={e => onUpdate(row.id, { height: parseInt(e.target.value) })} className="flex-1 h-1" style={{ accentColor: ACCENT }} />
      </div>
    </div>
  );

  const TemplateCard = ({ template, onSelect }) => (
    <div onClick={() => onSelect(template)} className="group cursor-pointer rounded-xl overflow-hidden border border-gray-100 hover:border-teal-400/50 bg-white shadow-sm transition-all relative">
      <div className="relative h-28 overflow-hidden">
        <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {template.premium && <div className="absolute top-2 right-2 bg-amber-400 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1"><Star className="w-2.5 h-2.5" />PREMIUM</div>}
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-gray-700 truncate">{template.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{template.rows.length} filas</p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Paintbrush className="w-5 h-5" style={{ color: ACCENT }} />
          <h2 className="text-lg font-bold text-gray-900">Diseñar tienda</h2>
          <div className="flex items-center gap-2 ml-4">
            <button onClick={() => setDesignStep('builder')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={designStep === 'builder' ? { backgroundColor: ACCENT + '15', color: ACCENT, border: `1px solid ${ACCENT}40` } : { backgroundColor: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' }}
            >
              <LayoutGrid className="w-3.5 h-3.5" />1. Estructura
            </button>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <button onClick={() => rows.length > 0 && setDesignStep('texts')} disabled={rows.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
              style={designStep === 'texts' ? { backgroundColor: ACCENT + '15', color: ACCENT, border: `1px solid ${ACCENT}40` } : { backgroundColor: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' }}
            >
              2. Textos
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1 gap-1">
            <button onClick={() => setPreviewDevice('desktop')} className="p-1.5 rounded-md transition-all" style={previewDevice === 'desktop' ? { backgroundColor: 'white', color: '#111827', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' } : { color: '#9ca3af' }}><Monitor className="w-4 h-4" /></button>
            <button onClick={() => setPreviewDevice('mobile')} className="p-1.5 rounded-md transition-all" style={previewDevice === 'mobile' ? { backgroundColor: 'white', color: '#111827', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' } : { color: '#9ca3af' }}><Smartphone className="w-4 h-4" /></button>
          </div>
          <button onClick={handleSave} disabled={saveStatus === 'saving'} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 shadow-sm" style={{ backgroundColor: ACCENT }}>
            {saveStatus === 'saving' ? <RefreshCcw className="w-4 h-4 animate-spin" /> : saveStatus === 'saved' ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? 'Guardado' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <aside className="w-[320px] bg-white border-r border-gray-100 flex flex-col overflow-y-auto shrink-0">
          {designStep === 'builder' ? (
            <>
              <div className="p-6 border-b border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-4">Nueva Estructura</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Nombre</label>
                    <input type="text" placeholder="Ej: Landing Producto" value={structureName} onChange={e => setStructureName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Imagen de Referencia</label>
                    {referenceImageUrl ? (
                      <div className="relative h-24 rounded-lg overflow-hidden border border-gray-200"><img src={referenceImageUrl} className="w-full h-full object-cover" /><button onClick={() => setReferenceImageUrl('')} className="absolute top-2 right-2 p-1 rounded bg-black/50 text-white"><X className="w-3 h-3" /></button></div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-gray-200 hover:border-teal-400 bg-gray-50 cursor-pointer transition-all">
                        <Upload className="w-4 h-4 text-gray-400 mb-1" />
                        <span className="text-[10px] font-medium text-gray-500">Subir imagen</span>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReferenceUpload} />
                      </label>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] font-semibold text-gray-700 shrink-0">Color de Fondo</label>
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Filas ({rows.length})</p>
                </div>
                <div className="space-y-3">
                  {rows.map((row, idx) => <RowBlock key={row.id} row={row} index={idx} total={rows.length} onUpdate={updateRow} onDelete={deleteRow} onMoveUp={moveRowUp} onMoveDown={moveRowDown} />)}
                  <button onClick={addRow} className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-gray-500 hover:text-teal-500 hover:border-teal-400 text-xs font-bold flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" />Agregar Fila</button>
                </div>
              </div>
            </>
          ) : (
             <div className="p-6">
               <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-4">Textos por Bloque</p>
               <div className="space-y-4">
                 {rows.map((row, idx) => (
                   <div key={row.id} className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
                     <span className="text-[10px] font-bold uppercase text-teal-600">{idx + 1}. {row.label}</span>
                     <input type="text" placeholder="Título..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" />
                   </div>
                 ))}
               </div>
             </div>
          )}
        </aside>

        {/* Canvas & Gallery */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
            <div style={{ width: previewDevice === 'desktop' ? '100%' : '390px', backgroundColor: bgColor, transition: 'width 0.3s ease' }}
              className="rounded-xl overflow-hidden shadow-lg min-h-[300px] border border-gray-200">
              {rows.map((row) => (
                <div key={row.id} style={{ height: `${row.height}px` }} className="flex w-full border-b border-gray-100/50 last:border-0">
                  {Array.from({ length: row.columns }).map((_, ci) => (
                    <div key={ci} className="flex-1 border-r border-gray-100/50 flex flex-col items-center justify-center text-gray-300">
                      <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                      <span className="text-[10px] opacity-50">{row.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="h-[220px] bg-white border-t border-gray-200 shrink-0 flex flex-col">
            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-800">Galería EcommMagic</p>
              <div className="flex gap-1">
                {['todas', 'premium'].map(f => (
                  <button key={f} onClick={() => setGalleryFilter(f)} className="px-3 py-1 rounded text-[10px] font-bold uppercase transition-all"
                    style={galleryFilter === f ? { backgroundColor: ACCENT + '20', color: ACCENT } : { color: '#9ca3af' }}>{f}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-x-auto p-4 flex gap-4" style={{ width: 'max-content' }}>
              {filteredTemplates.map(t => <div key={t.id} className="w-[160px]"><TemplateCard template={t} onSelect={applyTemplate} /></div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
