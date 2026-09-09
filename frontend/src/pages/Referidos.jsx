import React, { useState } from 'react';
import { Share2, Award, Copy, Check, Users, DollarSign, ArrowUpRight } from 'lucide-react';

export default function Referidos() {
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://www.estrategasia.com/registro?ref=demo123';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div class="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <Share2 class="w-8 h-8 text-indigo-400" />
          <span>Programa de Referidos</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Recomienda nuestra plataforma a otros creadores y e-commercers y gana el 20% de comisión recurrente por cada suscripción activa.
        </p>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="glass-panel p-6 rounded-3xl border border-white/10 flex items-center justify-between">
          <div class="space-y-1.5">
            <span class="block text-xs text-slate-500 font-semibold uppercase">Referidos Totales</span>
            <h4 class="text-2xl font-bold text-white">12</h4>
          </div>
          <div class="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
            <Users class="w-5 h-5" />
          </div>
        </div>

        <div class="glass-panel p-6 rounded-3xl border border-white/10 flex items-center justify-between">
          <div class="space-y-1.5">
            <span class="block text-xs text-slate-500 font-semibold uppercase">Comisión Acumulada</span>
            <h4 class="text-2xl font-bold text-emerald-400">$180.50 USD</h4>
          </div>
          <div class="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
            <DollarSign class="w-5 h-5" />
          </div>
        </div>

        <div class="glass-panel p-6 rounded-3xl border border-white/10 flex items-center justify-between">
          <div class="space-y-1.5">
            <span class="block text-xs text-slate-500 font-semibold uppercase">Pendiente de Pago</span>
            <h4 class="text-2xl font-bold text-yellow-400">$45.00 USD</h4>
          </div>
          <div class="w-10 h-10 bg-yellow-500/10 text-yellow-400 rounded-xl flex items-center justify-center">
            <ArrowUpRight class="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Affiliate link box */}
      <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <h3 class="font-bold text-lg text-slate-200">Tu Enlace de Afiliado</h3>
        <p class="text-xs text-slate-400 leading-relaxed">
          Comparte este enlace único en tus redes sociales, videos de YouTube o grupos de e-commerce. Cuando un usuario se registre e inicie un plan, verás reflejadas tus ganancias automáticamente.
        </p>

        <div class="flex flex-col sm:flex-row items-center gap-3">
          <input 
            type="text" 
            readOnly 
            class="glass-input w-full font-mono text-xs text-slate-300 py-3 select-all bg-black/20" 
            value={referralLink}
          />
          <button 
            onClick={handleCopy}
            class="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 whitespace-nowrap"
          >
            {copied ? <Check class="w-4 h-4" /> : <Copy class="w-4 h-4" />}
            <span>{copied ? 'Copiado' : 'Copiar Enlace'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
