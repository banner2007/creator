import React, { useState } from 'react';
import { Layers, Check, ShieldAlert, Sparkles, Settings } from 'lucide-react';

export default function Confirma() {
  const [waGatewayKey, setWaGatewayKey] = useState('');
  const [templateText, setTemplateText] = useState('Hola {nombre}, confirmamos tu pedido de {producto} por ${total}. ¿Es correcta tu dirección: {direccion}?');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div class="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <Layers class="w-8 h-8 text-emerald-400" />
          <span>Optimizador de Confirmaciones</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Reduce tus devoluciones y confirma direcciones automáticamente enviando alertas automáticas a tus compradores.
        </p>
      </div>

      {/* Fluorescent Green Highlight - WhatsApp Gateway Settings */}
      <div class="p-6 rounded-3xl bg-[#00FF00]/10 border border-[#00FF00]/40 text-slate-200 space-y-4 shadow-[0_0_20px_rgba(0,255,0,0.1)]">
        <div class="flex items-center gap-3">
          <div class="w-2.5 h-2.5 rounded-full bg-[#00FF00] animate-ping"></div>
          <h3 class="font-extrabold text-base text-[#00FF00] uppercase tracking-wider">Conexión de WhatsApp Gateway (Pendiente de Conexión)</h3>
        </div>
        <p class="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Para que los mensajes automáticos se envíen desde tu propio número telefónico, necesitaremos conectar un proveedor de API de WhatsApp (como Twilio o WASender API). Configura tu llave de acceso a continuación.
        </p>

        <form onSubmit={handleSave} class="space-y-4 pt-2">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[#00FF00]">API Key / Token del Gateway de WhatsApp</label>
            <input 
              type="password" 
              placeholder="wapi_token_..."
              class="glass-input w-full border-[#00FF00]/20 focus:border-[#00FF00]" 
              value={waGatewayKey}
              onChange={e => setWaGatewayKey(e.target.value)}
            />
          </div>
          <div class="flex justify-end">
            <button 
              type="submit"
              class="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#00FF00] hover:bg-[#00CC00] text-black transition-all flex items-center gap-2"
            >
              {saved ? <Check class="w-4 h-4" /> : null}
              <span>{saved ? 'Guardado Temporalmente' : 'Vincular Gateway'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Templates configuration */}
      <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
        <h3 class="font-bold text-lg text-slate-200 border-b border-white/5 pb-4">
          Plantilla del Mensaje de Confirmación
        </h3>
        
        <div class="space-y-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-slate-400">Texto del Mensaje</label>
            <textarea 
              rows="4"
              class="glass-input w-full py-3"
              value={templateText}
              onChange={e => setTemplateText(e.target.value)}
            />
            <span class="text-[10px] text-slate-500">Puedes usar las variables: {"{nombre}"}, {"{producto}"}, {"{total}"}, {"{direccion}"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
