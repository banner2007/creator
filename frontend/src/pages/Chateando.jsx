import React, { useState } from 'react';
import { MessageSquare, Check, Power, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Chateando() {
  const [enabled, setEnabled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openAiKey, setOpenAiKey] = useState('');

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
          <MessageSquare class="w-8 h-8 text-cyan-400" />
          <span>Chateando - Agente de Chatbot IA</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Activa un agente de Inteligencia Artificial para responder a tus clientes 24/7 y cerrar ventas de forma automatizada.
        </p>
      </div>

      {/* Fluorescent Green Highlight - OpenAI / Agent Integration */}
      <div class="p-6 rounded-3xl bg-[#00FF00]/10 border border-[#00FF00]/40 text-slate-200 space-y-4 shadow-[0_0_20px_rgba(0,255,0,0.1)]">
        <div class="flex items-center gap-3">
          <div class="w-2.5 h-2.5 rounded-full bg-[#00FF00] animate-ping"></div>
          <h3 class="font-extrabold text-base text-[#00FF00] uppercase tracking-wider">Integración Llave de OpenAI (Pendiente de Conexión)</h3>
        </div>
        <p class="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Para que el Agente IA pueda generar respuestas personalizadas e inteligentes basadas en la información de tu catálogo de productos, introduce tu OpenAI API Key.
        </p>

        <form onSubmit={handleSave} class="space-y-4 pt-2">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-[#00FF00]">OpenAI API Key (sk-...)</label>
            <input 
              type="password" 
              placeholder="sk-proj-..."
              class="glass-input w-full border-[#00FF00]/20 focus:border-[#00FF00]" 
              value={openAiKey}
              onChange={e => setOpenAiKey(e.target.value)}
            />
          </div>
          <div class="flex justify-end">
            <button 
              type="submit"
              class="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#00FF00] hover:bg-[#00CC00] text-black transition-all flex items-center gap-2"
            >
              {saved ? <Check class="w-4 h-4" /> : null}
              <span>{saved ? 'Guardado Temporalmente' : 'Vincular API'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Configuration Status Card */}
      <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
        <div class="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 class="font-bold text-lg text-slate-200">Estado del Agente</h3>
          <button 
            onClick={() => setEnabled(!enabled)}
            class={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              enabled 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            <Power class="w-3.5 h-3.5" />
            <span>{enabled ? 'Agente Activo' : 'Agente Desactivado'}</span>
          </button>
        </div>

        <div class="space-y-4 text-xs text-slate-400 leading-relaxed">
          <p class="flex items-start gap-2.5">
            <ShieldCheck class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>El chatbot responderá automáticamente a cualquier conversación de WhatsApp entrante que no haya sido respondida por un humano en un lapso de 3 minutos.</span>
          </p>
          <p class="flex items-start gap-2.5">
            <HelpCircle class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>Puedes configurar y entrenar la personalidad del agente cargando archivos de preguntas frecuentes (FAQs) en la pestaña de configuración del proyecto.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
