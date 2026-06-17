import { create } from 'zustand';
import { storage, ref, listAll, getDownloadURL, uploadBytes, deleteObject } from '../utils/firebase.js';

// Helper function to create compressed thumbnail WebP client-side
function createThumbnail(file, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize logic keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob conversion failed'));
          },
          'image/webp',
          0.75 // 75% quality for 25% WebP thumbnail size
        );
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

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
  firebaseTemplates: [],
  templateUrlsCache: {},
  isLoadingTemplates: false,

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
      } else {
        alert(data.error || 'Error al crear el proyecto');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Error de red al crear el proyecto');
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

  generateImages: async (producto, estilo, formato, cantidad, projectId, engine = 'kie-ai', referenceImage = '', productImage = '', calidad = 'medio') => {
    set({ isGeneratingImages: true });
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: getHeaders(get().token),
        body: JSON.stringify({ producto, estilo, formato, cantidad, projectId, engine, referenceImage, productImage, calidad })
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

  // Firebase Storage Template Actions
  fetchFirebaseTemplates: async () => {
    // If already loaded templates list, don't list again
    if (get().firebaseTemplates.length > 0) return;
    
    set({ isLoadingTemplates: true });
    try {
      const templatesRef = ref(storage, 'templates/WEBP_25%');
      const res = await listAll(templatesRef);
      // Map to filename and path
      const files = res.items.map(item => ({
        name: item.name,
        fullPath: item.fullPath,
        // e.g. "imagen_001.webp" from "templates/WEBP_25%/imagen_001.webp"
        baseName: item.name
      }));
      
      // Sort alphabetically/numerically
      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      
      set({ firebaseTemplates: files });
    } catch (err) {
      console.error('Error fetching templates from Firebase:', err);
    } finally {
      set({ isLoadingTemplates: false });
    }
  },

  getTemplateDownloadUrl: async (fullPath) => {
    const cache = get().templateUrlsCache;
    if (cache[fullPath]) return cache[fullPath];
    
    try {
      const fileRef = ref(storage, fullPath);
      const url = await getDownloadURL(fileRef);
      set(state => ({
        templateUrlsCache: { ...state.templateUrlsCache, [fullPath]: url }
      }));
      return url;
    } catch (err) {
      console.error(`Error getting download URL for ${fullPath}:`, err);
      return '';
    }
  },

  uploadFirebaseTemplate: async (file) => {
    set({ isLoadingTemplates: true });
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const originalPath = `templates/WEBP_100%/${fileName}`;
      const thumbnailPath = `templates/WEBP_25%/${fileName}`;
      
      // 1. Upload original high-quality file
      const originalRef = ref(storage, originalPath);
      await uploadBytes(originalRef, file);
      
      // 2. Create and upload thumbnail client-side using Canvas
      const thumbnailBlob = await createThumbnail(file, 400, 400);
      const thumbnailRef = ref(storage, thumbnailPath);
      await uploadBytes(thumbnailRef, thumbnailBlob);
      
      // Add to list
      const newTemplate = {
        name: fileName,
        fullPath: thumbnailPath,
        baseName: fileName
      };
      
      set(state => ({
        firebaseTemplates: [newTemplate, ...state.firebaseTemplates]
      }));
      
      // Get URLs and cache them immediately
      const originalUrl = await getDownloadURL(originalRef);
      const thumbnailUrl = await getDownloadURL(thumbnailRef);
      set(state => ({
        templateUrlsCache: {
          ...state.templateUrlsCache,
          [originalPath]: originalUrl,
          [thumbnailPath]: thumbnailUrl
        }
      }));
      
      return true;
    } catch (err) {
      console.error('Error uploading template:', err);
      alert('Error al subir la plantilla a Firebase: ' + err.message);
      return false;
    } finally {
      set({ isLoadingTemplates: false });
    }
  },

  deleteFirebaseTemplate: async (fileName) => {
    set({ isLoadingTemplates: true });
    try {
      const originalPath = `templates/WEBP_100%/${fileName}`;
      const thumbnailPath = `templates/WEBP_25%/${fileName}`;
      
      // Delete original
      try {
        await deleteObject(ref(storage, originalPath));
      } catch (e) {
        console.warn(`Could not delete original: ${originalPath}`, e);
      }
      
      // Delete thumbnail
      try {
        await deleteObject(ref(storage, thumbnailPath));
      } catch (e) {
        console.warn(`Could not delete thumbnail: ${thumbnailPath}`, e);
      }
      
      // Remove from state
      set(state => {
        const filteredTemplates = state.firebaseTemplates.filter(t => t.name !== fileName);
        const updatedCache = { ...state.templateUrlsCache };
        delete updatedCache[originalPath];
        delete updatedCache[thumbnailPath];
        return {
          firebaseTemplates: filteredTemplates,
          templateUrlsCache: updatedCache
        };
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Error al borrar la plantilla de Firebase: ' + err.message);
      return false;
    } finally {
      set({ isLoadingTemplates: false });
    }
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
