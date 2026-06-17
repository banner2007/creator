import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { Plus, Tag, DollarSign, Trash2, Edit3, Archive, Eye, Folder, Layers, Sparkles } from 'lucide-react';

export default function ProductsPage() {
  const {
    products,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    selectProduct
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState('draft');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice(0);
    setCategory('');
    setCoverImage('');
    setStatus('draft');
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(parseFloat(product.price) || 0);
    setCategory(product.category || '');
    setCoverImage(product.cover_image || '');
    setStatus(product.status || 'draft');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      description,
      price: parseFloat(price) || 0,
      category,
      cover_image: coverImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
      status
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await createProduct(payload);
    }

    setShowModal(false);
    setLoading(false);
    fetchProducts();
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      await deleteProduct(id);
      fetchProducts();
    }
  };

  return (
    <div class="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Gestión de Productos
          </h2>
          <p class="text-slate-400 mt-2 text-sm">
            Administra los productos de tu catálogo para generar anuncios y landings con inteligencia artificial.
          </p>
        </div>
        
        <button 
          onClick={openCreateModal}
          class="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 text-white"
        >
          <Plus class="w-4 h-4" />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Grid of Products */}
      {products.length === 0 ? (
        <div class="glass-panel p-16 text-center text-slate-500 border border-white/10 rounded-3xl">
          <Folder class="w-16 h-16 mx-auto mb-4 stroke-1 text-slate-600" />
          <h3 class="text-lg font-bold text-slate-400 mb-2">No hay productos registrados</h3>
          <p class="text-sm max-w-md mx-auto mb-6">
            Agrega tu primer producto (nombre, descripción, fotos) para desbloquear las herramientas del Estudio IA de alta conversión.
          </p>
          <button
            onClick={openCreateModal}
            class="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/25"
          >
            Agregar mi Primer Producto
          </button>
        </div>
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <div 
              key={product.id}
              class="glass-panel border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-white/20 transition-all duration-300 group"
            >
              {/* Product Cover Image */}
              <div class="aspect-square w-full relative bg-slate-950 overflow-hidden">
                <img 
                  src={product.cover_image} 
                  alt={product.name} 
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                
                {/* Status Badge */}
                <div class="absolute top-4 left-4">
                  <span class={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${
                    product.status === 'active' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : product.status === 'archived'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {product.status === 'active' ? 'Activo' : product.status === 'archived' ? 'Archivado' : 'Borrador'}
                  </span>
                </div>

                {/* Price tag */}
                <div class="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <span class="text-sm font-extrabold text-white">${product.price}</span>
                </div>
              </div>

              {/* Product Info */}
              <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span class="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-1">
                    {product.category || 'Sin Categoría'}
                  </span>
                  <h4 class="font-bold text-slate-100 group-hover:text-purple-400 transition-colors line-clamp-1">
                    {product.name}
                  </h4>
                  <p class="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {product.description || 'Sin descripción detallada del producto.'}
                  </p>
                </div>

                {/* Actions */}
                <div class="flex items-center justify-between pt-4 border-t border-white/5">
                  <button
                    onClick={() => openEditModal(product)}
                    class="p-2 rounded-lg bg-white/5 hover:bg-purple-600/10 border border-white/5 hover:border-purple-500/30 text-slate-400 hover:text-purple-300 transition-all"
                    title="Editar Producto"
                  >
                    <Edit3 class="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(product.id)}
                    class="p-2 rounded-lg bg-white/5 hover:bg-red-600/10 border border-white/5 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all"
                    title="Eliminar Producto"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div class="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-2">
              {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h3>
            <p class="text-xs text-slate-400 mb-6">
              Esta información será leída por la IA para diseñar anuncios persuasivos y redactar copys.
            </p>
            
            <form onSubmit={handleSubmit} class="space-y-5">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Nombre del Producto</label>
                <input 
                  type="text" 
                  placeholder="Ej: Cobija piel de conejo" 
                  class="glass-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required 
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-400">Precio de Venta ($)</label>
                  <div class="relative flex items-center">
                    <DollarSign class="w-4 h-4 text-slate-500 absolute left-3" />
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      class="glass-input pl-9 w-full"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-400">Categoría</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Hogar, Tecnología" 
                    class="glass-input"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Descripción Comercial (Dolores y Beneficios)</label>
                <textarea 
                  rows="4"
                  placeholder="Ej: Cobija térmica ultrasuave ideal para invierno. Es antialérgica, ligera y lavable. Mantiene el calor corporal sin sofocar..." 
                  class="glass-input resize-none"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required 
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">URL de Imagen de Portada</label>
                <input 
                  type="text" 
                  placeholder="https://ejemplo.com/foto-producto.jpg" 
                  class="glass-input"
                  value={coverImage}
                  onChange={e => setCoverImage(e.target.value)}
                />
                <span class="text-[10px] text-slate-500">Deja vacío para usar una imagen genérica por defecto.</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-400">Estado</label>
                <select
                  class="glass-input bg-slate-950"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>
              
              <div class="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button 
                  type="button" 
                  class="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-white/5 transition-all"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                
                <button 
                  type="submit"
                  disabled={loading}
                  class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition-all disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
