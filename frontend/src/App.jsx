import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useStore } from './store/useStore.js';
import { LayoutDashboard, PenTool, Image, LogOut, Moon, Sun, ShieldAlert, Sparkles, CreditCard, Layers } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import BuilderPage from './pages/BuilderPage.jsx';
import ImageGenPage from './pages/ImageGenPage.jsx';

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
          <nav class="space-y-2">
            <Link to="/" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <LayoutDashboard class="w-5 h-5" />
              <span class="text-sm font-semibold">Proyectos</span>
            </Link>
            <Link to="/builder" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <PenTool class="w-5 h-5" />
              <span class="text-sm font-semibold">Constructor</span>
            </Link>
            <Link to="/ai" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-slate-300 hover:text-white">
              <Image class="w-5 h-5" />
              <span class="text-sm font-semibold">Estudio IA</span>
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
          <div class="flex gap-4">
            <Link to="/" class="text-slate-400 hover:text-white"><LayoutDashboard class="w-5 h-5" /></Link>
            <Link to="/builder" class="text-slate-400 hover:text-white"><PenTool class="w-5 h-5" /></Link>
            <Link to="/ai" class="text-slate-400 hover:text-white"><Image class="w-5 h-5" /></Link>
            <button onClick={logout} class="text-red-400"><LogOut class="w-5 h-5" /></button>
          </div>
        </header>

        {/* View Content */}
        <main class="flex-1 relative z-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/ai" element={<ImageGenPage />} />
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
