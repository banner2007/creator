import React, { useState } from 'react';
import { Shield, Phone, MapPin, Truck, ExternalLink, Search } from 'lucide-react';

export default function Proveedores() {
  const [search, setSearch] = useState('');

  const suppliers = [
    {
      id: 1,
      name: 'Logística Express LATAM',
      location: 'Bogotá, Colombia',
      coverage: 'Nacional (CO, EC, PE)',
      specialty: 'Tecnología & Gadgets',
      deliveryTime: '24-48 horas',
      contact: '+573123456789'
    },
    {
      id: 2,
      name: 'Proveedor Importaciones Asia-Medellín',
      location: 'Medellín, Colombia',
      coverage: 'Nacional (CO)',
      specialty: 'Hogar & Cocina',
      deliveryTime: '48-72 horas',
      contact: '+573987654321'
    }
  ];

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <Truck class="w-8 h-8 text-amber-400" />
          <span>Directorio de Proveedores y Agentes</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Contacta directamente con agentes verificados y bodegas locales de dropshipping para procesar tus pedidos con pago contra entrega.
        </p>
      </div>

      {/* Search and Filters */}
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div class="relative flex items-center max-w-md w-full">
          <Search class="w-4 h-4 text-slate-500 absolute left-3.5" />
          <input
            type="text"
            placeholder="Buscar proveedores por nombre o nicho..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            class="glass-input pl-10 w-full"
          />
        </div>
      </div>

      {/* Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSuppliers.map(sup => (
          <div key={sup.id} class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-lg text-slate-200">{sup.name}</h3>
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase">
                  <Shield class="w-3 h-3" /> Verificado
                </span>
              </div>

              <div class="grid grid-cols-2 gap-4 py-2 text-xs">
                <div class="space-y-1">
                  <span class="block text-slate-500 font-semibold uppercase">Ubicación</span>
                  <span class="text-slate-300 flex items-center gap-1"><MapPin class="w-3.5 h-3.5 text-amber-400" /> {sup.location}</span>
                </div>
                <div class="space-y-1">
                  <span class="block text-slate-500 font-semibold uppercase">Tiempos de Envío</span>
                  <span class="text-slate-300">{sup.deliveryTime}</span>
                </div>
                <div class="space-y-1">
                  <span class="block text-slate-500 font-semibold uppercase">Especialidad</span>
                  <span class="text-slate-300">{sup.specialty}</span>
                </div>
                <div class="space-y-1">
                  <span class="block text-slate-500 font-semibold uppercase">Cobertura</span>
                  <span class="text-slate-300">{sup.coverage}</span>
                </div>
              </div>
            </div>

            <div class="pt-2">
              <a 
                href={`https://wa.me/${sup.contact}`}
                target="_blank"
                rel="noopener noreferrer"
                class="w-full py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 hover:bg-amber-500/10 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Phone class="w-4 h-4" />
                <span>Contactar por WhatsApp</span>
                <ExternalLink class="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
