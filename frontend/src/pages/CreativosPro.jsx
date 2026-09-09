import React, { useState } from 'react';
import { Layers, Sparkles, Image, Settings, Download, Trash, RefreshCw } from 'lucide-react';

export default function CreativosPro() {
  const [template, setTemplate] = useState('ecommerce');
  const [title, setTitle] = useState('¡Super Oferta!');
  const [discount, setDiscount] = useState('50% OFF');
  const [ctaText, setCtaText] = useState('Comprar Ahora');
  const [imageFile, setImageFile] = useState(null);

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <Layers class="w-8 h-8 text-fuchsia-400" />
          <span>Creativos Pro</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Crea banners y diseños publicitarios de alta conversión combinando tu producto, textos atractivos y fondos premium.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column - 5 Cols */}
        <div class="lg:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <h3 class="font-bold text-lg text-slate-200 border-b border-white/5 pb-4">
            Ajustes del Banner
          </h3>

          <div class="space-y-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Plantilla de Estilo</label>
              <select 
                class="glass-input w-full bg-slate-900 text-slate-300"
                value={template}
                onChange={e => setTemplate(e.target.value)}
              >
                <option value="ecommerce">E-commerce Moderno</option>
                <option value="minimal">Minimalista Elegante</option>
                <option value="neon">Brillo Neón Comercial</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Título Principal</label>
              <input 
                type="text" 
                class="glass-input w-full" 
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Etiqueta de Descuento</label>
              <input 
                type="text" 
                class="glass-input w-full" 
                value={discount}
                onChange={e => setDiscount(e.target.value)}
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Texto del Botón (CTA)</label>
              <input 
                type="text" 
                class="glass-input w-full" 
                value={ctaText}
                onChange={e => setCtaText(e.target.value)}
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Cargar Imagen de Producto</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                class="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/5 file:text-slate-300 hover:file:bg-white/10"
              />
            </div>
          </div>
        </div>

        {/* Preview Canvas - 7 Cols */}
        <div class="lg:col-span-7 flex flex-col items-center gap-6">
          <div 
            class={`w-full aspect-[4/3] max-w-lg rounded-3xl relative overflow-hidden border border-white/10 flex flex-col justify-between p-8 ${
              template === 'neon' 
                ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 shadow-[0_0_50px_rgba(168,85,247,0.15)]' 
                : template === 'minimal'
                ? 'bg-gradient-to-br from-slate-900 to-zinc-900'
                : 'bg-gradient-to-br from-purple-950/40 via-slate-900 to-blue-950/40'
            }`}
          >
            {/* Header Content */}
            <div class="flex justify-between items-start">
              <span class={`text-[10px] uppercase font-extrabold tracking-widest px-3 py-1.5 rounded-full border ${
                template === 'neon' 
                  ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400' 
                  : 'bg-white/5 border-white/10 text-white'
              }`}>
                {discount}
              </span>
              <Sparkles class="w-5 h-5 text-purple-400 animate-pulse" />
            </div>

            {/* Product Center Image Overlay */}
            {imageFile ? (
              <div class="absolute inset-0 flex items-center justify-center p-20 pointer-events-none">
                <img src={imageFile} alt="Product preview" class="max-h-full max-w-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" />
              </div>
            ) : (
              <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                <Image class="w-12 h-12" />
                <span class="text-xs">Sube una imagen para previsualizar</span>
              </div>
            )}

            {/* Bottom Content */}
            <div class="space-y-4 relative z-10">
              <h4 class={`text-3xl font-extrabold leading-tight ${
                template === 'neon' ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-300' : 'text-white'
              }`}>
                {title}
              </h4>
              <button class={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-transform active:scale-95 ${
                template === 'neon'
                  ? 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white shadow-fuchsia-500/25'
                  : 'bg-white text-slate-950 hover:bg-slate-100 shadow-white/10'
              }`}>
                {ctaText}
              </button>
            </div>
          </div>

          <div class="flex gap-4">
            <button class="px-5 py-2.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 shadow-lg shadow-purple-500/20">
              <Download class="w-4 h-4" />
              <span>Descargar Imagen</span>
            </button>
            <button 
              onClick={() => { setImageFile(null); setTitle('¡Super Oferta!'); setDiscount('50% OFF'); }}
              class="px-5 py-2.5 text-xs font-bold rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white"
            >
              <RefreshCw class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
