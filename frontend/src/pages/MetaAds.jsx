import React, { useState } from 'react';
import { Megaphone, Play, Pause, Plus, ShieldAlert, Sparkles, Check } from 'lucide-react';

export default function MetaAds() {
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [saved, setSaved] = useState(false);

  const mockAds = [
    { id: 1, name: 'Anuncio - Humidificador Antigravedad', status: 'active', spend: '$140.20', cpc: '$0.12', roas: '3.4x' },
    { id: 2, name: 'Anuncio - Depiladora Láser IPL', status: 'paused', spend: '$89.00', cpc: '$0.19', roas: '2.1x' }
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <Megaphone class="w-8 h-8 text-purple-400" />
          <span>Mi Agente de Meta Ads</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Monitorea tus campañas de Facebook Ads, trackea conversiones y administra presupuestos directamente.
        </p>
      </div>

      {/* Fluorescent Green Highlight Banner / API Panel */}
      <div class="p-6 rounded-3xl bg-[#00FF00]/10 border border-[#00FF00]/40 text-slate-200 space-y-4 shadow-[0_0_20px_rgba(0,255,0,0.1)]">
        <div class="flex items-center gap-3">
          <div class="w-2.5 h-2.5 rounded-full bg-[#00FF00] animate-ping"></div>
          <h3 class="font-extrabold text-base text-[#00FF00] uppercase tracking-wider">Integración API de Meta Ads (Pendiente de Conexión)</h3>
        </div>
        <p class="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Esta sección requerirá vincular tu cuenta comercial de Facebook Business. Cuando estés listo para realizar la integración técnica con la API de Meta Ads Cloud, configuraremos las credenciales a continuación para sincronizar tus campañas reales.
        </p>

        <form onSubmit={handleSave} class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[#00FF00]">ID del Píxel de Meta</label>
            <input 
              type="text" 
              placeholder="Ej: 847291039482710"
              class="glass-input w-full border-[#00FF00]/20 focus:border-[#00FF00]" 
              value={pixelId}
              onChange={e => setPixelId(e.target.value)}
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[#00FF00]">Token de Acceso del API de Conversiones</label>
            <input 
              type="password" 
              placeholder="EAAGb..."
              class="glass-input w-full border-[#00FF00]/20 focus:border-[#00FF00]" 
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
            />
          </div>
          <div class="md:col-span-2 flex justify-end">
            <button 
              type="submit"
              class="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#00FF00] hover:bg-[#00CC00] text-black transition-all flex items-center gap-2"
            >
              {saved ? <Check class="w-4 h-4" /> : null}
              <span>{saved ? 'Guardado Temporalmente' : 'Guardar Credenciales'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Ads Monitor Section */}
      <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div class="flex justify-between items-center border-b border-white/5 pb-4">
          <h3 class="font-bold text-lg text-slate-200">Campañas Activas (Vista Demo)</h3>
          <button class="px-4 py-2 text-xs font-bold rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white flex items-center gap-1.5">
            <Plus class="w-3.5 h-3.5" />
            <span>Crear Campaña</span>
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-white/5 text-[10px] uppercase text-slate-500 font-bold">
                <th class="py-3 px-4">Anuncio</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4">Gasto total</th>
                <th class="py-3 px-4">CPC</th>
                <th class="py-3 px-4">ROAS</th>
                <th class="py-3 px-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              {mockAds.map(ad => (
                <tr key={ad.id} class="border-b border-white/5 text-xs text-slate-300 hover:bg-white/[0.01]">
                  <td class="py-3.5 px-4 font-bold text-slate-200">{ad.name}</td>
                  <td class="py-3.5 px-4">
                    <span class={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      ad.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {ad.status === 'active' ? 'Activo' : 'Pausado'}
                    </span>
                  </td>
                  <td class="py-3.5 px-4">{ad.spend}</td>
                  <td class="py-3.5 px-4">{ad.cpc}</td>
                  <td class="py-3.5 px-4 font-extrabold text-white">{ad.roas}</td>
                  <td class="py-3.5 px-4">
                    <button class="text-slate-400 hover:text-white transition-colors">
                      {ad.status === 'active' ? <Pause class="w-4 h-4" /> : <Play class="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
