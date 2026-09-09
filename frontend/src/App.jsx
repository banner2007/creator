import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useStore } from './store/useStore.js';
import { LayoutDashboard, PenTool, Image, LogOut, Moon, Sun, ShieldAlert, Sparkles, CreditCard, Layers, Folder, Megaphone, BrainCircuit, Calculator, LifeBuoy, GraduationCap, Award, MessageSquare, Truck, Users, Settings as SettingsIcon, Share2, HelpCircle } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import BuilderPage from './pages/BuilderPage.jsx';
import ImageGenPage from './pages/ImageGenPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import AdGenPage from './pages/AdGenPage.jsx';
import LandingGenPage from './pages/LandingGenPage.jsx';
import MarketResearchPage from './pages/MarketResearchPage.jsx';
import FinancialPage from './pages/FinancialPage.jsx';
import SupportPage from './pages/SupportPage.jsx';
import ConstructorPage from './pages/ConstructorPage.jsx';
import Academia from './pages/Academia.jsx';
import Coaching from './pages/Coaching.jsx';
import Experiencia from './pages/Experiencia.jsx';
import CreativosPro from './pages/CreativosPro.jsx';
import ProductResearch from './pages/ProductResearch.jsx';
import MetaAds from './pages/MetaAds.jsx';
import Proveedores from './pages/Proveedores.jsx';
import Confirma from './pages/Confirma.jsx';
import Chateando from './pages/Chateando.jsx';
import Referidos from './pages/Referidos.jsx';
import Equipo from './pages/Equipo.jsx';
import Settings from './pages/Settings.jsx';

function AuthGuard({ children }) {
  const token = useStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function LoginView() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const setSession = useStore((state) => state.setSession);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { email, password, name } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Autenticación fallida');
      }

      if (isRegister) {
        setIsRegister(false);
        alert('Registro exitoso. Inicia sesión ahora.');
      } else {
        setSession(data.session.access_token, data.user);
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen w-full relative flex items-center justify-center bg-slate-950 overflow-hidden px-4">
      {/* Decorative neon backdrops */}
      <div class="absolute w-[500px] h-[500px] bg-purple-600/20 rounded-full filter blur-[120px] -top-40 -left-40 animate-pulse-slow"></div>
      <div class="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full filter blur-[120px] -bottom-40 -right-40 animate-pulse-slow"></div>

      <div class="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 border border-white/10">
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30 mb-4">
            <Sparkles class="w-8 h-8 text-white animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <h2 class="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-purple-400 bg-clip-text text-transparent">
            Creator Shopy
          </h2>
          <p class="text-slate-400 mt-2 text-sm">
            {isRegister ? 'Crea tu cuenta de creador' : 'Accede a tu estudio comercial de IA'}
          </p>
        </div>

        {errorMsg && (
          <div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert class="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-5">
          {isRegister && (
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Nombre completo</label>
              <input 
                type="text" 
                placeholder="Carlos Alba" 
                class="glass-input" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-400">Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="ejemplo@shopy.uno" 
              class="glass-input" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-400">Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              class="glass-input" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            class="w-full mt-2 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all duration-300 transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : isRegister ? 'Registrarme' : 'Entrar al Estudio'}
          </button>
        </form>

        <div class="mt-8 text-center border-t border-white/5 pt-6 text-sm text-slate-400">
          <span>{isRegister ? '¿Ya tienes una cuenta?' : '¿Nuevo en la plataforma?'}</span>
          <button 
            type="button" 
            class="text-purple-400 hover:underline font-semibold ml-1.5"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Inicia Sesión' : 'Regístrate Gratis'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MainLayout() {
  const logout = useStore((state) => state.logout);
  const user = useStore((state) => state.user);
  
  return (
    <div class="min-h-screen bg-slate-950 flex">
      {/* Dynamic Glows */}
      <div class="absolute w-[400px] h-[400px] bg-purple-600/10 rounded-full filter blur-[150px] top-10 left-10 pointer-events-none"></div>
      
      {/* Side Navigation Panel */}
      <aside class="w-64 glass-panel border-r border-white/5 flex flex-col justify-between p-6 relative z-10 shrink-0 hidden md:flex">
        <div>
          {/* Logo */}
          <div class="flex items-center gap-3 mb-10">
            <div class="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="font-bold text-lg leading-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Creator</h1>
              <span class="text-xs text-purple-400">shopy.uno</span>
            </div>
          </div>

          {/* Links */}
          <nav class="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            <Link to="/dashboard" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <LayoutDashboard class="w-4 h-4 text-purple-400" />
              <span class="text-xs font-semibold">Dashboard</span>
            </Link>
            <Link to="/dashboard/academia" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <GraduationCap class="w-4 h-4 text-emerald-400" />
              <span class="text-xs font-semibold">Academia <span class="text-[9px] text-emerald-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/dashboard/coaching" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <Award class="w-4 h-4 text-yellow-400" />
              <span class="text-xs font-semibold">Coaching <span class="text-[9px] text-yellow-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/landing-generator" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <Layers class="w-4 h-4 text-indigo-400" />
              <span class="text-xs font-semibold">Crea tu Landing</span>
            </Link>
            <Link to="/experiencia" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <MessageSquare class="w-4 h-4 text-sky-400" />
              <span class="text-xs font-semibold">Experiencia <span class="text-[9px] text-sky-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/ai" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <Image class="w-4 h-4 text-purple-400" />
              <span class="text-xs font-semibold">Estudio IA <span class="text-[9px] text-purple-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/creativospro" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <PenTool class="w-4 h-4 text-fuchsia-400" />
              <span class="text-xs font-semibold">Creativos Pro <span class="text-[9px] text-fuchsia-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/dashboard/product-research" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <BrainCircuit class="w-4 h-4 text-indigo-400" />
              <span class="text-xs font-semibold">Producto Ganador <span class="text-[9px] text-indigo-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/dashboard/meta-ads" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <Megaphone class="w-4 h-4 text-purple-400" />
              <span class="text-xs font-semibold">Mi Agente <span class="text-[9px] text-purple-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/dashboard/informe-financiero" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <Calculator class="w-4 h-4 text-slate-400" />
              <span class="text-xs font-semibold">Informe Financiero <span class="text-[9px] text-slate-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/dashboard/proveedores" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <Truck class="w-4 h-4 text-amber-400" />
              <span class="text-xs font-semibold">Proveedores <span class="text-[9px] text-amber-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <a href="https://discord.gg/dpxM6SaUr" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <HelpCircle class="w-4 h-4 text-blue-400" />
              <span class="text-xs font-semibold">Unete a Discord</span>
            </a>
            <Link to="/constructor" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <PenTool class="w-4 h-4 text-teal-400" />
              <span class="text-xs font-semibold">Mi Tienda</span>
            </Link>
            <Link to="/confirma" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <Layers class="w-4 h-4 text-emerald-400" />
              <span class="text-xs font-semibold">Confirma <span class="text-[9px] text-emerald-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/chateando" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <MessageSquare class="w-4 h-4 text-cyan-400" />
              <span class="text-xs font-semibold">Chateando <span class="text-[9px] text-cyan-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/dashboard/soporte" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <LifeBuoy class="w-4 h-4 text-red-400" />
              <span class="text-xs font-semibold">Soporte <span class="text-[9px] text-red-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/dashboard/referidos" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <Share2 class="w-4 h-4 text-indigo-400" />
              <span class="text-xs font-semibold">Referidos <span class="text-[9px] text-indigo-400 font-bold ml-1">Nuevo</span></span>
            </Link>
            <Link to="/dashboard/equipo" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <Users class="w-4 h-4 text-fuchsia-400" />
              <span class="text-xs font-semibold">Equipo</span>
            </Link>
            <Link to="/dashboard/settings" class="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <SettingsIcon class="w-4 h-4 text-slate-400" />
              <span class="text-xs font-semibold">Settings</span>
            </Link>
          </nav>
        </div>

        {/* Profile Card / Credits */}
        <div class="border-t border-white/5 pt-6 space-y-4">
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-purple-950/50 border border-purple-500/20 flex items-center justify-center font-bold text-purple-300 text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div class="min-w-0">
              <p class="text-xs text-slate-500 truncate">Suscrito a plan</p>
              <h4 class="text-sm font-bold text-slate-200 capitalize truncate">{user?.plan || 'Free'}</h4>
            </div>
          </div>
          
          <div class="p-3.5 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-purple-300">
              <CreditCard class="w-4 h-4" />
              <span>Créditos IA</span>
            </div>
            <span class="font-extrabold text-white text-base">{user?.credits ?? 0}</span>
          </div>

          <button 
            onClick={logout}
            class="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-white/[0.02] hover:bg-red-500/10 hover:text-red-400 border border-white/5 hover:border-red-500/20 transition-all text-slate-400 text-sm font-semibold"
          >
            <LogOut class="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Floating Navbar (Mobile Layout/Actions) */}
        <header class="glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between md:hidden relative z-20 shrink-0">
          <div class="flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-purple-500" />
            <span class="font-bold text-sm">Creator Shopy</span>
          </div>
          <div class="flex gap-3.5 flex-wrap justify-end">
            <Link to="/" class="text-slate-400 hover:text-white" title="Proyectos"><LayoutDashboard class="w-4.5 h-4.5" /></Link>
            <Link to="/products" class="text-slate-400 hover:text-white" title="Productos"><Folder class="w-4.5 h-4.5" /></Link>
            <Link to="/ad-generator" class="text-slate-400 hover:text-white" title="Anuncios"><Megaphone class="w-4.5 h-4.5" /></Link>
            <Link to="/landing-generator" class="text-slate-400 hover:text-white" title="Landings"><Layers class="w-4.5 h-4.5" /></Link>
            <Link to="/research" class="text-slate-400 hover:text-white" title="Investigación"><BrainCircuit class="w-4.5 h-4.5" /></Link>
            <Link to="/financial" class="text-slate-400 hover:text-white" title="Finanzas"><Calculator class="w-4.5 h-4.5" /></Link>
            <Link to="/support" class="text-slate-400 hover:text-white" title="Soporte"><LifeBuoy class="w-4.5 h-4.5" /></Link>
            <button onClick={logout} class="text-red-400" title="Salir"><LogOut class="w-4.5 h-4.5" /></button>
          </div>
        </header>

        {/* View Content */}
        <main class="flex-1 relative z-10 font-sans">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/constructor" element={<ConstructorPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/ad-generator" element={<AdGenPage />} />
            <Route path="/landing-generator" element={<LandingGenPage />} />
            <Route path="/research" element={<MarketResearchPage />} />
            <Route path="/financial" element={<FinancialPage />} />
            <Route path="/ai" element={<ImageGenPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/dashboard/academia" element={<Academia />} />
            <Route path="/dashboard/coaching" element={<Coaching />} />
            <Route path="/experiencia" element={<Experiencia />} />
            <Route path="/creativospro" element={<CreativosPro />} />
            <Route path="/dashboard/product-research" element={<ProductResearch />} />
            <Route path="/dashboard/meta-ads" element={<MetaAds />} />
            <Route path="/dashboard/informe-financiero" element={<FinancialPage />} />
            <Route path="/dashboard/proveedores" element={<Proveedores />} />
            <Route path="/confirma" element={<Confirma />} />
            <Route path="/chateando" element={<Chateando />} />
            <Route path="/dashboard/soporte" element={<SupportPage />} />
            <Route path="/dashboard/referidos" element={<Referidos />} />
            <Route path="/dashboard/equipo" element={<Equipo />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route 
          path="/*" 
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
