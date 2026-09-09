import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Key, User, ShieldAlert, Check } from 'lucide-react';
import { useStore } from '../store/useStore.js';

export default function Settings() {
  const user = useStore((state) => state.user);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div class="p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <SettingsIcon class="w-8 h-8 text-slate-400" />
          <span>Configuración del Sistema</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Edita los detalles de tu perfil, gestiona las llaves de API y ajusta las preferencias globales de tu cuenta.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-8">
        {/* Profile Card */}
        <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
          <h3 class="font-bold text-lg text-slate-200 border-b border-white/5 pb-4 flex items-center gap-2">
            <User class="w-5 h-5 text-purple-400" />
            <span>Perfil de Usuario</span>
          </h3>

          <form onSubmit={handleSave} class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Nombre Completo</label>
                <input 
                  type="text" 
                  class="glass-input w-full"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Correo Electrónico (No modificable)</label>
                <input 
                  type="email" 
                  disabled
                  class="glass-input w-full bg-slate-900/50 text-slate-500 cursor-not-allowed"
                  value={user?.email || 'demo@usuario.com'}
                />
              </div>
            </div>

            <div class="flex justify-end">
              <button 
                type="submit"
                class="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg text-white transition-all flex items-center gap-2"
              >
                {saved ? <Check class="w-4 h-4" /> : <Save class="w-4 h-4" />}
                <span>Guardar Perfil</span>
              </button>
            </div>
          </form>
        </div>

        {/* API Credentials */}
        <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
          <h3 class="font-bold text-lg text-slate-200 border-b border-white/5 pb-4 flex items-center gap-2">
            <Key class="w-5 h-5 text-purple-400" />
            <span>Credenciales de Desarrollador</span>
          </h3>

          <form onSubmit={handleSave} class="space-y-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Kie.ai / Flux Kontext API Key</label>
              <input 
                type="password" 
                placeholder="Introducir KIE_API_KEY para habilitar Studio IA..."
                class="glass-input w-full"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <span class="text-[10px] text-slate-500">Esto anulará la clave predeterminada del servidor para tu cuenta.</span>
            </div>

            <div class="flex justify-end">
              <button 
                type="submit"
                class="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg text-white transition-all flex items-center gap-2"
              >
                {saved ? <Check class="w-4 h-4" /> : <Save class="w-4 h-4" />}
                <span>Vincular Llaves</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
