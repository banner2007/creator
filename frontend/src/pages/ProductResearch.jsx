import React, { useState } from 'react';
import { Search, BrainCircuit, Star, ExternalLink, ArrowRight, DollarSign, TrendingUp } from 'lucide-react';

export default function ProductResearch() {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const products = [
    {
      id: 1,
      name: 'Humidificador Ultrasónico Antigravedad',
      category: 'hogar',
      sellingPrice: 49.99,
      costPrice: 12.50,
      cpa: 8.50,
      profit: 28.99,
      trending: true,
      engagement: '9.4/10',
      imageUrl: 'https://images.unsplash.com/photo-1519183071298-a2962feb14f4?w=400&auto=format&fit=crop&q=60'
    },
    {
      id: 2,
      name: 'Depiladora Láser Portátil IPL',
      category: 'belleza',
      sellingPrice: 89.99,
      costPrice: 22.00,
      cpa: 14.00,
      profit: 53.99,
      trending: true,
      engagement: '8.9/10',
      imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=60'
    },
    {
      id: 3,
      name: 'Cargador Magnético Inalámbrico 3 en 1',
      category: 'tecnologia',
      sellingPrice: 39.99,
      costPrice: 9.00,
      cpa: 7.20,
      profit: 23.79,
      trending: false,
      engagement: '7.8/10',
      imageUrl: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?w=400&auto=format&fit=crop&q=60'
    }
  ];

  const filteredProducts = products.filter(p => {
    const matchesFilter = filter === 'all' || p.category === filter || (filter === 'trending' && p.trending);
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <BrainCircuit class="w-8 h-8 text-indigo-400" />
          <span>Buscador de Productos Ganadores</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Filtra bases de datos actualizadas de productos de alta conversión listos para importar en LATAM.
        </p>
      </div>

      {/* Tabs and Search */}
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div class="flex gap-2 flex-wrap">
          {['all', 'trending', 'hogar', 'belleza', 'tecnologia'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              class={`px-4 py-2 text-xs font-bold rounded-xl transition-all capitalize ${
                filter === tab 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'all' ? 'Todos' : tab === 'trending' ? '🔥 En Tendencia' : tab}
            </button>
          ))}
        </div>

        <div class="relative flex items-center max-w-md w-full">
          <Search class="w-4 h-4 text-slate-500 absolute left-3.5" />
          <input
            type="text"
            placeholder="Buscar producto ganadores..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            class="glass-input pl-10 w-full"
          />
        </div>
      </div>

      {/* Product List */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(p => (
          <div key={p.id} class="glass-panel overflow-hidden rounded-3xl border border-white/10 hover:border-indigo-500/30 transition-all flex flex-col justify-between">
            <div class="relative h-48 w-full bg-slate-900 overflow-hidden">
              <img 
                src={p.imageUrl} 
                alt={p.name}
                class="w-full h-full object-cover" 
              />
              <span class="absolute top-4 left-4 bg-indigo-500/95 text-white text-[9px] uppercase font-bold tracking-wider px-2 py-1 rounded-md">
                Engagement: {p.engagement}
              </span>
            </div>

            <div class="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div class="space-y-2">
                <h3 class="font-bold text-slate-200 line-clamp-2">{p.name}</h3>
                
                <div class="grid grid-cols-3 gap-2 py-2">
                  <div class="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span class="block text-[10px] text-slate-500 font-semibold uppercase">Venta</span>
                    <span class="text-sm font-bold text-slate-200">${p.sellingPrice}</span>
                  </div>
                  <div class="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <span class="block text-[10px] text-slate-500 font-semibold uppercase">Costo</span>
                    <span class="text-sm font-bold text-slate-200">${p.costPrice}</span>
                  </div>
                  <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span class="block text-[10px] text-emerald-400 font-semibold uppercase">Margen</span>
                    <span class="text-sm font-bold text-emerald-300">${p.profit}</span>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <button class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2">
                  <span>Importar Producto</span>
                  <ArrowRight class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
