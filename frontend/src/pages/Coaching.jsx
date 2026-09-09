import React, { useState } from 'react';
import { Calendar, User, Phone, Mail, Award, Clock, ArrowRight } from 'lucide-react';

export default function Coaching() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: 'principiante',
    objective: ''
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
  };

  return (
    <div class="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <Award class="w-8 h-8 text-yellow-400" />
          <span>Coaching E-commerce 1-a-1</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Acelera tus resultados con mentorías personalizadas impartidas por expertos en Dropshipping y venta directa en LATAM.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Info Column */}
        <div class="md:col-span-5 space-y-6">
          <div class="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 class="font-bold text-lg text-slate-200">¿Qué incluye el Coaching?</h3>
            <ul class="space-y-3 text-sm text-slate-400">
              <li class="flex items-start gap-2.5">
                <Clock class="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>Sesión de 60 minutos en vivo vía Zoom.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Award class="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>Auditoría de tu tienda y campañas activas.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <Calendar class="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>Hoja de ruta personalizada y plan de acción.</span>
              </li>
            </ul>
          </div>

          <div class="p-6 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs">
            Mentorías limitadas sujetas a disponibilidad del equipo técnico.
          </div>
        </div>

        {/* Form Column */}
        <div class="md:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10">
          {success ? (
            <div class="text-center py-8 space-y-4">
              <div class="w-16 h-16 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto">
                <Calendar class="w-8 h-8" />
              </div>
              <h3 class="font-bold text-xl text-slate-200">¡Solicitud Enviada!</h3>
              <p class="text-sm text-slate-400 max-w-md mx-auto">
                Tu solicitud de asesoría ha sido registrada. Nuestro equipo se pondrá en contacto contigo vía WhatsApp o correo electrónico para agendar el horario.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                class="px-5 py-2.5 text-xs font-bold rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
              >
                Volver a solicitar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} class="space-y-5">
              <h3 class="font-bold text-lg text-slate-200 border-b border-white/5 pb-4">
                Solicitar una Asesoría
              </h3>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Nombre completo</label>
                <div class="relative flex items-center">
                  <User class="w-4 h-4 text-slate-500 absolute left-3" />
                  <input 
                    type="text" 
                    required 
                    class="glass-input pl-9 w-full" 
                    placeholder="Carlos Pérez"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-400">Correo Electrónico</label>
                  <div class="relative flex items-center">
                    <Mail class="w-4 h-4 text-slate-500 absolute left-3" />
                    <input 
                      type="email" 
                      required 
                      class="glass-input pl-9 w-full" 
                      placeholder="carlos@correo.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-400">Teléfono / WhatsApp</label>
                  <div class="relative flex items-center">
                    <Phone class="w-4 h-4 text-slate-500 absolute left-3" />
                    <input 
                      type="tel" 
                      required 
                      class="glass-input pl-9 w-full" 
                      placeholder="+57 300 123 4567"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Nivel de Experiencia</label>
                <select 
                  class="glass-input w-full bg-slate-900 text-slate-300"
                  value={formData.experience}
                  onChange={e => setFormData({...formData, experience: e.target.value})}
                >
                  <option value="principiante">Principiante (Sin ventas todavía)</option>
                  <option value="intermedio">Intermedio (Primeras ventas / facturando)</option>
                  <option value="avanzado">Avanzado (Buscando escalar campaña)</option>
                </select>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">¿Cuál es tu principal obstáculo o duda hoy?</label>
                <textarea 
                  rows="3"
                  required
                  class="glass-input w-full py-3" 
                  placeholder="Ej: Tengo problemas configurando el pixel de facebook / No logro bajar mi CPA..."
                  value={formData.objective}
                  onChange={e => setFormData({...formData, objective: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                class="w-full py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 shadow-lg text-white transition-all flex items-center justify-center gap-2"
              >
                <span>Enviar Solicitud</span>
                <ArrowRight class="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
