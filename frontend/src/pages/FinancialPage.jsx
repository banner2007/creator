import React, { useState } from 'react';
import { Percent, TrendingUp, DollarSign, Calculator, Scale, AlertCircle, ShieldAlert } from 'lucide-react';

export default function FinancialPage() {
  const [sellingPrice, setSellingPrice] = useState(39.99);
  const [productCost, setProductCost] = useState(12.50);
  const [shippingCost, setShippingCost] = useState(4.00);
  const [cpa, setCpa] = useState(10.00);

  // Math calculations
  const grossMargin = Math.max(0, sellingPrice - productCost - shippingCost);
  const grossMarginPct = sellingPrice > 0 ? (grossMargin / sellingPrice) * 100 : 0;
  
  const netProfit = grossMargin - cpa;
  const roi = (productCost + shippingCost + cpa) > 0 ? (netProfit / (productCost + shippingCost + cpa)) * 100 : 0;

  const breakevenRoas = grossMargin > 0 ? (sellingPrice / grossMargin).toFixed(2) : 'N/A';
  const targetRoas = cpa > 0 ? (sellingPrice / cpa).toFixed(2) : 'N/A';

  const maxCpaRecommended = grossMargin * 0.65; // Recommended to keep at least 35% margin for safety

  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <Calculator class="w-8 h-8 text-purple-400" />
          <span>Calculadora de Análisis Financiero</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Simula tus márgenes de ganancia, calcula el ROAS de equilibrio y proyecta los costos máximos por adquisición (CPA) para tus campañas de dropshipping.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Inputs Panel - 5 Cols */}
        <div class="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <h3 class="font-bold text-lg text-slate-200 border-b border-white/5 pb-4">
            Costos e Ingresos
          </h3>

          <div class="space-y-5">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Precio de Venta al Público ($)</label>
              <div class="relative flex items-center">
                <DollarSign class="w-4 h-4 text-slate-500 absolute left-3" />
                <input 
                  type="number" 
                  step="0.01"
                  class="glass-input pl-9 w-full font-bold"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Costo del Producto / Proveedor ($)</label>
              <div class="relative flex items-center">
                <DollarSign class="w-4 h-4 text-slate-500 absolute left-3" />
                <input 
                  type="number" 
                  step="0.01"
                  class="glass-input pl-9 w-full font-medium"
                  value={productCost}
                  onChange={e => setProductCost(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Costo de Envío / Logística ($)</label>
              <div class="relative flex items-center">
                <DollarSign class="w-4 h-4 text-slate-500 absolute left-3" />
                <input 
                  type="number" 
                  step="0.01"
                  class="glass-input pl-9 w-full font-medium"
                  value={shippingCost}
                  onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">CPA Promedio (Costo de Adquisición / Facebook Ads) ($)</label>
              <div class="relative flex items-center">
                <DollarSign class="w-4 h-4 text-slate-500 absolute left-3" />
                <input 
                  type="number" 
                  step="0.01"
                  class="glass-input pl-9 w-full font-medium"
                  value={cpa}
                  onChange={e => setCpa(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Metrics Panel - 7 Cols */}
        <div class="lg:col-span-7 space-y-6">
          <h3 class="font-bold text-lg text-slate-200">Métricas Clave de Rendimiento</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Gross Margin Card */}
            <div class="glass-card p-6 rounded-2xl relative overflow-hidden">
              <div class="flex justify-between items-start text-slate-400 mb-3">
                <span class="text-sm font-semibold">Margen Bruto</span>
                <Scale class="w-5 h-5 text-blue-400" />
              </div>
              <h3 class="text-3xl font-extrabold text-white">${grossMargin.toFixed(2)}</h3>
              <span class="text-xs text-blue-300 font-semibold mt-1.5 block">
                {grossMarginPct.toFixed(1)}% del precio de venta
              </span>
            </div>

            {/* Net Profit Card */}
            <div class={`glass-card p-6 rounded-2xl relative overflow-hidden border ${
              netProfit > 0 
                ? 'border-green-500/10 bg-green-500/[0.01]' 
                : 'border-red-500/15 bg-red-500/[0.01]'
            }`}>
              <div class="flex justify-between items-start text-slate-400 mb-3">
                <span class="text-sm font-semibold">Beneficio Neto (por venta)</span>
                <TrendingUp class={`w-5 h-5 ${netProfit > 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <h3 class={`text-3xl font-extrabold ${netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${netProfit.toFixed(2)}
              </h3>
              <span class="text-xs text-slate-400 mt-1.5 block">
                Retorno de Inversión (ROI): <strong class="text-slate-200">{roi.toFixed(1)}%</strong>
              </span>
            </div>

            {/* ROAS Breakeven Card */}
            <div class="glass-card p-6 rounded-2xl relative overflow-hidden">
              <div class="flex justify-between items-start text-slate-400 mb-3">
                <span class="text-xs font-semibold uppercase tracking-wider text-purple-400">ROAS de Equilibrio</span>
                <Percent class="w-5 h-5 text-purple-400" />
              </div>
              <h3 class="text-3xl font-extrabold text-white">{breakevenRoas}x</h3>
              <span class="text-[10px] text-slate-500 mt-1.5 block leading-relaxed">
                Si tu ROAS en Facebook es inferior a este número, estarás perdiendo dinero.
              </span>
            </div>

            {/* Target ROAS Card */}
            <div class="glass-card p-6 rounded-2xl relative overflow-hidden">
              <div class="flex justify-between items-start text-slate-400 mb-3">
                <span class="text-xs font-semibold uppercase tracking-wider text-indigo-400">ROAS Objetivo (Actual)</span>
                <Percent class="w-5 h-5 text-indigo-400" />
              </div>
              <h3 class="text-3xl font-extrabold text-white">{targetRoas}x</h3>
              <span class="text-[10px] text-slate-500 mt-1.5 block leading-relaxed">
                Tasa de retorno de anuncios según tu CPA actual.
              </span>
            </div>
          </div>

          {/* Advice/Warnings panel */}
          <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h4 class="font-bold text-sm text-slate-200 flex items-center gap-2">
              <AlertCircle class="w-4 h-4 text-purple-400" />
              Diagnóstico Comercial Recomendado
            </h4>
            
            <div class="space-y-3 text-xs text-slate-400 leading-relaxed">
              <p>
                *   **CPA Máximo Recomendado**: Para mantener un margen neto saludable, tu CPA no debería exceder los **${maxCpaRecommended.toFixed(2)} USD** (65% del margen bruto).
              </p>
              {netProfit <= 0 && (
                <div class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-start gap-2.5 mt-2">
                  <ShieldAlert class="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>¡Atención! Beneficio Neto Negativo:</strong> Tu CPA es igual o mayor a tu margen bruto. Debes bajar los costos de envío/producto, subir el precio de venta o mejorar el CTR de tus anuncios usando el Generador IA para bajar el CPA.
                  </p>
                </div>
              )}
              {grossMarginPct < 50 && (
                <div class="p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 flex items-start gap-2.5 mt-2">
                  <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    <strong>Margen de Producto ajustado:</strong> Tu margen bruto ({grossMarginPct.toFixed(0)}%) es menor al 50%. En dropshipping se recomienda apuntar a un margen bruto superior al 60% para poder absorber el costo de publicidad en escala.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
