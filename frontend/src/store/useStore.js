import { create } from 'zustand';

// Helper to set authorization headers
const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

export const useStore = create((set, get) => ({
  // Auth state
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  
  // App state
  projects: [],
  selectedProject: null,
  landings: [],
  selectedLanding: null,
  sections: [], // Active landing page sections
  products: [],
  selectedProduct: null,
  isResearching: false,
  
  // AI state
  generatedImages: [],
  isGeneratingImages: false,
  
  // UI / Editor State
  previewMode: 'desktop', // desktop, tablet, mobile
  activeSectionIdx: null,
  isSaving: false,
  saveStatus: 'saved', // saved, saving, error, idle
  
  // Actions
  setSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, projects: [], landings: [], selectedLanding: null, sections: [], products: [], selectedProduct: null });
  },
  
  updateUserCredits: (credits) => {
    const updatedUser = { ...get().user, credits };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  // Project Actions
  fetchProjects: async () => {
    try {
      const response = await fetch('/api/landing/projects', {
        headers: getHeaders(get().token)
      });
      const data = await response.json();
      if (response.ok) {
        set({ projects: data });
        if (data.length > 0 && !get().selectedProject) {
          get().selectProject(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  },

  createProject: async (name) => {
    try {
      const response = await fetch('/api/landing/project', {
        method: 'POST',
        headers: getHeaders(get().token),
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (response.ok) {
        set(state => ({ projects: [data, ...state.projects] }));
        get().selectProject(data);
        return data;
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }
  },

  selectProject: (project) => {
    set({ selectedProject: project, landings: [], selectedLanding: null, sections: [] });
    if (project) {
      get().fetchLandings(project.id);
    }
  },

  // Landing Page Actions
  fetchLandings: async (projectId) => {
    try {
      const response = await fetch(`/api/landing/project/${projectId}`, {
        headers: getHeaders(get().token)
      });
      const data = await response.json();
      if (response.ok) {
        set({ landings: data });
      }
    } catch (err) {
      console.error('Error fetching landings:', err);
    }
  },

  createLanding: async (projectId, title, slug) => {
    try {
      const response = await fetch('/api/landing', {
        method: 'POST',
        headers: getHeaders(get().token),
        body: JSON.stringify({ projectId, title, slug })
      });
      const data = await response.json();
      if (response.ok) {
        set(state => ({ landings: [data, ...state.landings] }));
        return data;
      } else {
        alert(data.error || 'Fallo al crear landing page');
      }
    } catch (err) {
      console.error('Error creating landing:', err);
    }
  },

  selectLanding: async (landing) => {
    if (!landing) {
      set({ selectedLanding: null, sections: [] });
      return;
    }
    
    set({ selectedLanding: landing, saveStatus: 'idle' });
    try {
      const response = await fetch(`/api/landing/${landing.id}`, {
        headers: getHeaders(get().token)
      });
      const data = await response.json();
      if (response.ok) {
        set({ sections: data.sections || [], activeSectionIdx: null });
      }
    } catch (err) {
      console.error('Error loading landing details:', err);
    }
  },

  // Editor Actions
  setSections: (sections) => {
    set({ sections });
    get().triggerAutosave();
  },

  updateSectionContent: (index, updatedContent) => {
    const updatedSections = [...get().sections];
    updatedSections[index] = {
      ...updatedSections[index],
      content_json: {
        ...updatedSections[index].content_json,
        ...updatedContent
      }
    };
    set({ sections: updatedSections });
    get().triggerAutosave();
  },

  addSection: (type) => {
    const newSection = {
      type,
      position: get().sections.length,
      content_json: getSeedContent(type)
    };
    set(state => ({
      sections: [...state.sections, newSection],
      activeSectionIdx: state.sections.length // select newly added section
    }));
    get().triggerAutosave();
  },

  removeSection: (index) => {
    const updatedSections = get().sections
      .filter((_, idx) => idx !== index)
      .map((sec, idx) => ({ ...sec, position: idx }));
    set({ sections: updatedSections, activeSectionIdx: null });
    get().triggerAutosave();
  },

  reorderSections: (draggedIdx, targetIdx) => {
    const items = [...get().sections];
    const [reorderedItem] = items.splice(draggedIdx, 1);
    items.splice(targetIdx, 0, reorderedItem);
    
    const finalized = items.map((sec, idx) => ({ ...sec, position: idx }));
    set({ sections: finalized, activeSectionIdx: targetIdx });
    get().triggerAutosave();
  },

  // Autosave Synchronization
  autosaveTimer: null,
  triggerAutosave: () => {
    // Clear existing debounce timer
    if (get().autosaveTimer) {
      clearTimeout(get().autosaveTimer);
    }
    
    set({ saveStatus: 'saving' });

    const timer = setTimeout(async () => {
      const landing = get().selectedLanding;
      if (!landing) return;

      try {
        const response = await fetch(`/api/landing/${landing.id}`, {
          method: 'PUT',
          headers: getHeaders(get().token),
          body: JSON.stringify({
            sections: get().sections
          })
        });

        if (response.ok) {
          set({ saveStatus: 'saved' });
        } else {
          set({ saveStatus: 'error' });
        }
      } catch (err) {
        console.error('Autosave failed:', err);
        set({ saveStatus: 'error' });
      }
    }, 1500); // Debounce save for 1.5 seconds

    set({ autosaveTimer: timer });
  },

  // Publish Page
  publishLanding: async (landingId) => {
    try {
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: getHeaders(get().token),
        body: JSON.stringify({ landingId })
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Publishing failed:', err);
      return { error: 'Error de red durante la publicación.' };
    }
  },

  // Image Generation
  generateImages: async (producto, estilo, formato, cantidad, projectId, engine = 'kie-ai', referenceImage = '') => {
    set({ isGeneratingImages: true });
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: getHeaders(get().token),
        body: JSON.stringify({ producto, estilo, formato, cantidad, projectId, engine, referenceImage })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        set(state => ({
          generatedImages: [...data.images, ...state.generatedImages]
        }));
        get().updateUserCredits(data.creditsLeft);
        return data.images;
      } else {
        alert(data.error || 'Generación de imágenes fallida');
      }
    } catch (err) {
      console.error('Image gen error:', err);
    } finally {
      set({ isGeneratingImages: false });
    }
  },

  fetchProjectImages: async (projectId) => {
    try {
      const response = await fetch(`/api/ai/project/${projectId}`, {
        headers: getHeaders(get().token)
      });
      const data = await response.json();
      if (response.ok) {
        set({ generatedImages: data });
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  },

  // Products CRUD Actions
  fetchProducts: async () => {
    try {
      const response = await fetch('/api/products', {
        headers: getHeaders(get().token)
      });
      const data = await response.json();
      if (response.ok) {
        set({ products: data });
        if (data.length > 0 && !get().selectedProduct) {
          set({ selectedProduct: data[0] });
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: getHeaders(get().token),
        body: JSON.stringify(productData)
      });
      const data = await response.json();
      if (response.ok) {
        set(state => ({ products: [data, ...state.products], selectedProduct: data }));
        return data;
      } else {
        alert(data.error || 'Error creando el producto');
      }
    } catch (err) {
      console.error('Error creating product:', err);
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(get().token),
        body: JSON.stringify(productData)
      });
      const data = await response.json();
      if (response.ok) {
        const updatedProducts = get().products.map(p => p.id === id ? data : p);
        set({ products: updatedProducts, selectedProduct: data });
        return data;
      } else {
        alert(data.error || 'Error actualizando el producto');
      }
    } catch (err) {
      console.error('Error updating product:', err);
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(get().token)
      });
      if (response.ok) {
        const updatedProducts = get().products.filter(p => p.id !== id);
        set(state => ({
          products: updatedProducts,
          selectedProduct: state.selectedProduct?.id === id ? (updatedProducts[0] || null) : state.selectedProduct
        }));
        return true;
      } else {
        const data = await response.json();
        alert(data.error || 'Error eliminando el producto');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
    return false;
  },

  selectProduct: (product) => set({ selectedProduct: product }),

  // OpenAI Research Actions
  runResearch: async (type, productId) => {
    set({ isResearching: true });
    try {
      const response = await fetch(`/api/ai/research/${type}`, {
        method: 'POST',
        headers: getHeaders(get().token),
        body: JSON.stringify({ productId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        get().updateUserCredits(data.creditsLeft);
        return data.report;
      } else {
        alert(data.error || `Error ejecutando investigación de ${type}`);
      }
    } catch (err) {
      console.error(`Error researching ${type}:`, err);
    } finally {
      set({ isResearching: false });
    }
    return null;
  },

  setPreviewMode: (previewMode) => set({ previewMode }),
  setActiveSectionIdx: (idx) => set({ activeSectionIdx: idx })
}));

// Seed templates helper
function getSeedContent(type) {
  switch (type) {
    case 'hero':
      return { title: 'Nuevo Título Hero', subtitle: 'Describe tu valor agregado', ctaText: 'Comprar', ctaLink: '#offer' };
    case 'benefits':
      return {
        title: 'Beneficios',
        items: [
          { title: 'Beneficio 1', description: 'Detalle sobre por qué es increíble.' },
          { title: 'Beneficio 2', description: 'Detalle adicional sobre la experiencia.' }
        ]
      };
    case 'offer':
      return { title: 'Oferta Especial', price: '29.99', originalPrice: '59.99', features: ['Característica A', 'Característica B'], badge: '30% OFF', buttonText: 'Ordenar' };
    case 'faq':
      return { title: 'Preguntas', questions: [{ q: '¿Pregunta?', a: 'Respuesta.' }] };
    case 'reviews':
      return { title: 'Testimonios', reviews: [{ name: 'Juan Perez', comment: 'Me encantó este producto.', rating: 5 }] };
    case 'gallery':
      return { title: 'Galería', images: [] };
    default:
      return {};
  }
}
