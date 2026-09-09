import React, { useState } from 'react';
import { Play, BookOpen, GraduationCap, Video, ArrowRight, Search, Award } from 'lucide-react';

export default function Academia() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const courses = [
    {
      id: 1,
      title: 'Empezando en Dropshipping LATAM',
      category: 'basic',
      duration: '45 mins',
      lessonsCount: 6,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60'
    },
    {
      id: 2,
      title: 'Dominando Facebook & Meta Ads con IA',
      category: 'advanced',
      duration: '1h 20 mins',
      lessonsCount: 12,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=60'
    },
    {
      id: 3,
      title: 'Copywriting Persuasivo para Landing Pages',
      category: 'marketing',
      duration: '35 mins',
      lessonsCount: 5,
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1542435503-956c469947f6?w=600&auto=format&fit=crop&q=60'
    }
  ];

  const filteredCourses = courses.filter(c => {
    const matchesTab = activeTab === 'all' || c.category === activeTab;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <GraduationCap class="w-8 h-8 text-emerald-400" />
          <span>Academia de Ventas & E-commerce</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Aprende a configurar tu tienda, estructurar embudos de venta ganadores y escalar tus campañas con Inteligencia Artificial.
        </p>
      </div>

      {/* Tabs and Search */}
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div class="flex gap-2 flex-wrap">
          {['all', 'basic', 'advanced', 'marketing'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              class={`px-4 py-2 text-xs font-bold rounded-xl transition-all capitalize ${
                activeTab === tab 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                  : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'all' ? 'Todos los Cursos' : tab}
            </button>
          ))}
        </div>

        <div class="relative flex items-center max-w-md w-full">
          <Search class="w-4 h-4 text-slate-500 absolute left-3.5" />
          <input
            type="text"
            placeholder="Buscar lección o curso..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            class="glass-input pl-10 w-full"
          />
        </div>
      </div>

      {/* Grid of Courses */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => (
          <div key={course.id} class="glass-panel overflow-hidden rounded-3xl border border-white/10 hover:border-emerald-500/30 transition-all group">
            <div class="relative h-48 w-full bg-slate-900 overflow-hidden">
              <img 
                src={course.thumbnail} 
                alt={course.title}
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div class="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                  <Play class="w-6 h-6 fill-white ml-0.5" />
                </div>
              </div>
              <span class="absolute top-4 left-4 bg-emerald-500/90 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md">
                {course.category}
              </span>
            </div>

            <div class="p-6 space-y-4">
              <h3 class="font-bold text-lg text-slate-200 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                {course.title}
              </h3>
              
              <div class="flex items-center justify-between text-xs text-slate-400">
                <span class="flex items-center gap-1.5"><Video class="w-3.5 h-3.5 text-emerald-400" /> {course.lessonsCount} lecciones</span>
                <span>{course.duration}</span>
              </div>

              <button class="w-full py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2">
                <span>Comenzar ahora</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
