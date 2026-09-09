import React, { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, Send, Check } from 'lucide-react';

export default function Experiencia() {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const reviews = [
    {
      id: 1,
      name: 'Andrés M.',
      rating: 5,
      comment: 'Excelente plataforma. He logrado crear más de 20 creativos con IA y las landings convierten súper rápido.',
      date: 'Hace 2 días'
    },
    {
      id: 2,
      name: 'Paola R.',
      rating: 4,
      comment: 'Me encanta la funcionalidad del constructor visual. El soporte es bastante atento.',
      date: 'Hace 1 semana'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div class="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <MessageSquare class="w-8 h-8 text-sky-400" />
          <span>Experiencia & Testimonios</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Comparte tu opinión sobre la herramienta. Nos ayuda a seguir mejorando y escalando la plataforma.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Form */}
        <div class="md:col-span-6 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10">
          {submitted ? (
            <div class="text-center py-10 space-y-4">
              <div class="w-14 h-14 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mx-auto">
                <Check class="w-7 h-7" />
              </div>
              <h3 class="font-bold text-lg text-slate-200">¡Gracias por tu valoración!</h3>
              <p class="text-xs text-slate-400">Tu retroalimentación ha sido enviada con éxito.</p>
              <button 
                onClick={() => { setSubmitted(false); setComment(''); }}
                class="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
              >
                Escribir otra reseña
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} class="space-y-5">
              <h3 class="font-bold text-lg text-slate-200 border-b border-white/5 pb-4">
                Deja tu Calificación
              </h3>

              <div class="flex flex-col gap-2">
                <label class="text-xs font-semibold text-slate-400">¿Qué puntuación nos das?</label>
                <div class="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      class="focus:outline-none transition-transform active:scale-95"
                    >
                      <Star 
                        class={`w-8 h-8 ${
                          star <= rating 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-slate-600'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Cuéntanos tu experiencia</label>
                <textarea 
                  rows="4"
                  required
                  class="glass-input w-full py-3" 
                  placeholder="¿Cómo te ha ayudado la IA a potenciar tus ventas?"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                class="w-full py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg text-white transition-all flex items-center justify-center gap-2"
              >
                <span>Enviar Reseña</span>
                <Send class="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Right List */}
        <div class="md:col-span-6 space-y-5">
          <h3 class="font-bold text-lg text-slate-200">Opiniones de la comunidad</h3>
          <div class="space-y-4">
            {reviews.map(rev => (
              <div key={rev.id} class="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-sm text-slate-200">{rev.name}</span>
                  <span class="text-[10px] text-slate-500">{rev.date}</span>
                </div>
                <div class="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      class={`w-3.5 h-3.5 ${
                        star <= rev.rating 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-slate-700'
                      }`} 
                    />
                  ))}
                </div>
                <p class="text-xs leading-relaxed text-slate-400">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
