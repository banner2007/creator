import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { useNavigate } from 'react-router-dom';
import { Plus, Layout, BarChart3, Globe, Copy, ExternalLink, Calendar, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Zustand Store
  const {
    projects,
    selectedProject,
    landings,
    fetchProjects,
    createProject,
    selectProject,
    createLanding,
    selectLanding,
    fetchLandings,
    deleteProject
  } = useStore();

  // Local State
  const [showProjModal, setShowProjModal] = useState(false);
  const [showLandingModal, setShowLandingModal] = useState(false);
  
  const [newProjName, setNewProjName] = useState('');
  const [newLandingTitle, setNewLandingTitle] = useState('');
  const [newLandingSlug, setNewLandingSlug] = useState('');

  const [loading, setLoading] = useState(false);

  // Stats (Mocked or calculated from analytics)
  const [stats, setStats] = useState({ visits: 1420, clicks: 312, conversion: 21.9 });

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    setLoading(true);
    await createProject(newProjName);
    setNewProjName('');
    setShowProjModal(false);
    setLoading(false);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    const confirmDelete = confirm(
      `¿Estás seguro de que deseas eliminar permanentemente el proyecto "${selectedProject.name}"?\n\nEsta acción no se puede deshacer y eliminará todas sus landing pages, secciones e imágenes asociadas.`
    );
    if (confirmDelete) {
      setLoading(true);
      await deleteProject(selectedProject.id);
      setLoading(false);
    }
  };

  const handleCreateLanding = async (e) => {
    e.preventDefault();
    if (!newLandingTitle.trim() || !newLandingSlug.trim()) return;
    setLoading(true);
    const result = await createLanding(selectedProject.id, newLandingTitle, newLandingSlug);
    if (result) {
      setNewLandingTitle('');
      setNewLandingSlug('');
      setShowLandingModal(false);
      
      // Auto-load details and direct to builder
      await selectLanding(result);
      navigate('/builder');
    }
    setLoading(false);
  };

  const handleEditLanding = async (landing) => {
    await selectLanding(landing);
    navigate('/builder');
  };

  const handleDuplicate = async (landingId) => {
    if (confirm('¿Deseas duplicar esta landing page?')) {
      try {
        const response = await fetch('/api/landing/duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${useStore.getState().token}`
          },
          body: JSON.stringify({ landingId })
        });
        if (response.ok) {
          fetchLandings(selectedProject.id);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Panel de Proyectos
          </h2>
          <p class="text-slate-400 mt-2 text-sm">
            Administra tus campañas, genera imágenes y edita tus funnels comerciales.
          </p>
        </div>
        
        <div class="flex gap-3">
          <button 
            onClick={() => setShowProjModal(true)}
            class="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all flex items-center gap-2"
          >
            <Plus class="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
          {selectedProject && (
            <>
              <button 
                onClick={() => setShowLandingModal(true)}
                class="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Plus class="w-4 h-4" />
                <span>Nueva Landing</span>
              </button>
              <button 
                onClick={handleDeleteProject}
                disabled={loading}
                class="px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                title="Eliminar Proyecto Permanentemente"
              >
                <Trash2 class="w-4 h-4" />
                <span>Eliminar Proyecto</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Project Selector Tabs */}
      <div class="flex flex-wrap gap-2.5 border-b border-white/5 pb-4">
        {projects.map(proj => (
          <button
            key={proj.id}
            onClick={() => selectProject(proj)}
            class={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              selectedProject?.id === proj.id
                ? 'bg-purple-600/10 border-purple-500/40 text-purple-300'
                : 'border-transparent bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {proj.name}
          </button>
        ))}
      </div>

      {/* Analytics Summary */}
      {selectedProject && (
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div class="flex justify-between items-start text-slate-400 mb-4">
              <span class="text-sm font-semibold">Visitas Totales</span>
              <Globe class="w-5 h-5 text-blue-400" />
            </div>
            <h3 class="text-3xl font-extrabold text-white">{stats.visits}</h3>
            <span class="text-xs text-green-400 font-semibold mt-2 block">↑ 12% desde la última semana</span>
          </div>

          <div class="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div class="flex justify-between items-start text-slate-400 mb-4">
              <span class="text-sm font-semibold">Clics en CTA</span>
              <BarChart3 class="w-5 h-5 text-purple-400" />
            </div>
            <h3 class="text-3xl font-extrabold text-white">{stats.clicks}</h3>
            <span class="text-xs text-green-400 font-semibold mt-2 block">↑ 8% tasa de interacción</span>
          </div>

          <div class="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div class="flex justify-between items-start text-slate-400 mb-4">
              <span class="text-sm font-semibold">Tasa de Conversión</span>
              <CheckCircle class="w-5 h-5 text-green-400" />
            </div>
            <h3 class="text-3xl font-extrabold text-white">{stats.conversion}%</h3>
            <span class="text-xs text-slate-400 mt-2 block">Promedio de conversión global</span>
          </div>
        </div>
      )}

      {/* Landing Pages Table/Grid */}
      {selectedProject ? (
        <div class="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div class="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <h3 class="font-bold text-lg text-slate-200">Landing Pages del Proyecto</h3>
            <span class="text-xs px-2.5 py-1 bg-white/5 rounded-full text-slate-400 border border-white/5">{landings.length} Páginas</span>
          </div>
          
          {landings.length === 0 ? (
            <div class="p-12 text-center text-slate-500">
              <Layout class="w-12 h-12 mx-auto mb-4 stroke-1" />
              <p class="text-sm">Aún no has creado ninguna landing page en este proyecto.</p>
              <button 
                onClick={() => setShowLandingModal(true)}
                class="mt-4 text-purple-400 hover:underline text-sm font-semibold"
              >
                Crear tu primera página
              </button>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-white/5 text-xs text-slate-400 uppercase tracking-wider">
                    <th class="px-6 py-4">Título / URL</th>
                    <th class="px-6 py-4">Slug</th>
                    <th class="px-6 py-4">Estado</th>
                    <th class="px-6 py-4">Creación</th>
                    <th class="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-sm">
                  {landings.map(landing => (
                    <tr key={landing.id} class="hover:bg-white/[0.02] transition-all group">
                      <td class="px-6 py-5">
                        <div class="font-bold text-slate-200">{landing.title}</div>
                        {landing.published ? (
                          <a 
                            href={`/published/${landing.slug}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            class="text-xs text-purple-400 hover:underline flex items-center gap-1 mt-1"
                          >
                            <span>{landing.slug}.shopy.uno</span>
                            <ExternalLink class="w-3 h-3" />
                          </a>
                        ) : (
                          <span class="text-xs text-slate-500 mt-1 block">Borrador no publicado</span>
                        )}
                      </td>
                      <td class="px-6 py-5 text-slate-400 font-mono text-xs">{landing.slug}</td>
                      <td class="px-6 py-5">
                        {landing.published ? (
                          <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                            Publicado
                          </span>
                        ) : (
                          <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-white/5">
                            Borrador
                          </span>
                        )}
                      </td>
                      <td class="px-6 py-5 text-slate-400 text-xs">
                        <div class="flex items-center gap-1.5">
                          <Calendar class="w-3.5 h-3.5" />
                          <span>{new Date(landing.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td class="px-6 py-5 text-right space-x-2">
                        <button
                          onClick={() => handleEditLanding(landing)}
                          class="px-3.5 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all inline-flex items-center gap-1"
                        >
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDuplicate(landing.id)}
                          class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all inline-flex"
                          title="Duplicar Página"
                        >
                          <Copy class="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div class="glass-panel rounded-3xl p-16 text-center text-slate-500 border border-white/10">
          <Layout class="w-16 h-16 mx-auto mb-4 stroke-1 text-slate-600" />
          <h3 class="text-lg font-bold text-slate-400 mb-2">Comienza tu viaje comercial</h3>
          <p class="text-sm max-w-md mx-auto">Registra un proyecto para comenzar a diseñar landing pages de alta conversión.</p>
          <button
            onClick={() => setShowProjModal(true)}
            class="mt-6 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/25"
          >
            Crear tu Primer Proyecto
          </button>
        </div>
      )}

      {/* Project Modal */}
      {showProjModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div class="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative">
            <h3 class="text-xl font-bold mb-2">Crear Nuevo Proyecto</h3>
            <p class="text-xs text-slate-400 mb-6">Agrupa tus landing pages, embudos y galerías de assets comerciales.</p>
            
            <form onSubmit={handleCreateProject} class="space-y-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Nombre del proyecto</label>
                <input 
                  type="text" 
                  placeholder="Ej: Calzado Deportivo 2026" 
                  class="glass-input"
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  required 
                />
              </div>
              
              <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-all"
                  onClick={() => setShowProjModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition-all disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Landing Page Modal */}
      {showLandingModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div class="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative">
            <h3 class="text-xl font-bold mb-2">Crear Nueva Landing Page</h3>
            <p class="text-xs text-slate-400 mb-6">Se generará un borrador inicial con la estructura de secciones predeterminadas.</p>
            
            <form onSubmit={handleCreateLanding} class="space-y-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Título de la Página</label>
                <input 
                  type="text" 
                  placeholder="Ej: Zapatillas Pro Max" 
                  class="glass-input"
                  value={newLandingTitle}
                  onChange={e => {
                    setNewLandingTitle(e.target.value);
                    // Generate basic slug automatically
                    setNewLandingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  required 
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Slug de la URL</label>
                <div class="flex items-center">
                  <input 
                    type="text" 
                    placeholder="zapatillas-pro-max" 
                    class="glass-input flex-1 rounded-r-none"
                    value={newLandingSlug}
                    onChange={e => setNewLandingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    required 
                  />
                  <span class="bg-white/5 border border-l-0 border-white/10 rounded-r-xl px-3 py-2.5 text-xs text-slate-500 font-mono">
                    .shopy.uno
                  </span>
                </div>
              </div>
              
              <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-all"
                  onClick={() => setShowLandingModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  class="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition-all disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Landing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
