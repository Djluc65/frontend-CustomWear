import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { adminAPI, productsAPI } from '../../services/api';

const CATEGORIES = [
  { slug: 't-shirts', name: 'T-shirts' },
  { slug: 'casquettes', name: 'Casquettes' },
  { slug: 'bonnets', name: 'Bonnets' },
  { slug: 'vestes', name: 'Vêstes' },
  { slug: 'vaisselle', name: 'Vaisselle' }
];

const GENDERS = [
  { value: 'unisexe', label: 'Unisexe' },
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
  { value: 'enfant', label: 'Enfant' }
];

const ALLOWED_COLORS = ['Noir', 'Blanc', 'Bleu', 'Marron', 'Rose', 'Jaune', 'Vert', 'Mauve', 'Gris'];
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'Unique'];

const AdminProductEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: 't-shirts',
    gender: 'unisexe',
    priceBase: '',
    status: 'active',
    featured: false,
    colors: [],
    sizes: [],
    stock: '',
    sku: ''
  });

  // Charger le produit existant
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await productsAPI.getProduct(id);
        const data = res?.data?.data?.product || res?.data?.product || res?.data;
        if (!data) throw new Error('Produit introuvable');
        const priceBase = Number(data?.price?.base ?? data?.price ?? 0);
        const sizes = Array.isArray(data?.sizes) ? data.sizes : (Array.isArray(data?.variants) ? Array.from(new Set(data.variants.map(v => v.size).filter(Boolean))) : []);
        const colors = Array.isArray(data?.colors) ? data.colors : (Array.isArray(data?.variants) ? Array.from(new Set(data.variants.map(v => v?.color?.name).filter(Boolean))) : []);
        const stock = (Array.isArray(data?.variants) && data.variants.length) ? Number(data.variants[0].stock || 0) : '';
        if (!cancelled) {
          setForm({
            name: data.name || '',
            description: data.description || '',
            shortDescription: data.shortDescription || '',
            category: typeof data.category === 'object' ? (data.category?.slug || data.category?.name || 't-shirts') : (data.category || 't-shirts'),
            gender: (data.gender || 'unisexe'),
            priceBase: priceBase ? String(priceBase) : '',
            status: data.status || 'active',
            featured: !!data.featured,
            colors,
            sizes,
            stock: stock !== undefined && stock !== null ? String(stock) : '',
            sku: data.sku || ''
          });
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err?.response?.data?.message || err?.message || 'Erreur de chargement du produit';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const toggleColor = (color) => {
    setForm(prev => {
      const exists = prev.colors.includes(color);
      return { ...prev, colors: exists ? prev.colors.filter(c => c !== color) : [...prev.colors, color] };
    });
  };

  const toggleSize = (size) => {
    setForm(prev => {
      const exists = prev.sizes.includes(size);
      return { ...prev, sizes: exists ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        gender: form.gender,
        price: { base: Number(form.priceBase || 0), currency: 'EUR' },
        status: form.status,
        featured: !!form.featured,
        sizes: form.sizes,
        colors: form.colors,
        sku: form.sku,
        stock: form.stock !== '' ? Number(form.stock) : undefined
      };
      const res = await adminAPI.updateProduct(id, payload);
      if (res?.data?.success) {
        navigate('/admin/products');
      } else {
        throw new Error(res?.data?.message || 'Échec de la mise à jour');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la sauvegarde';
      setError(msg);
      window.alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/products" 
              className="p-2 bg-white border border-gray-200 rounded-full text-gray-600 hover:text-black hover:border-black transition-all shadow-sm"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modifier le produit</h1>
              <p className="text-sm text-gray-500 mt-1">Gérez les informations et variantes du produit</p>
            </div>
          </div>
          <button 
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            form="edit-form"
            disabled={saving}
          >
            <FiSave className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form id="edit-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* General Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Informations générales</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du produit
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                    placeholder="Ex: T-shirt Premium Coton"
                    value={form.name} 
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea 
                    rows={6} 
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-all outline-none resize-none"
                    placeholder="Description détaillée du produit..."
                    value={form.description} 
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} 
                  />
                </div>
              </div>
            </div>

            {/* Variants Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Variantes</h2>
              </div>
              <div className="p-6 space-y-8">
                {/* Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Couleurs disponibles
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {ALLOWED_COLORS.map(color => {
                      const isSelected = form.colors.includes(color);
                      return (
                        <button
                          type="button"
                          key={color}
                          onClick={() => toggleColor(color)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                            isSelected 
                              ? 'bg-black text-white border-black shadow-md transform scale-105' 
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tailles disponibles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map(size => {
                      const isSelected = form.sizes.includes(size);
                      return (
                        <button
                          type="button"
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`w-12 h-12 flex items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200 ${
                            isSelected 
                              ? 'bg-black text-white border-black shadow-md transform scale-105' 
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings & Price */}
          <div className="space-y-8">
            {/* Organization Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Organisation</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                  <div className="relative">
                    <select 
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black appearance-none bg-white transition-all outline-none"
                      value={form.category} 
                      onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                  <div className="relative">
                    <select 
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black appearance-none bg-white transition-all outline-none"
                      value={form.gender} 
                      onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))}
                    >
                      {GENDERS.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <div className="relative">
                    <select 
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black appearance-none bg-white transition-all outline-none"
                      value={form.status} 
                      onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="draft">Brouillon</option>
                      <option value="discontinued">Arrêté</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-black checked:bg-black hover:border-black focus:ring-2 focus:ring-black focus:ring-offset-1"
                        checked={form.featured} 
                        onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))} 
                      />
                      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">
                      Mettre en avant
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Price & Stock Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Prix et Stock</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix de base</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      className="w-full pl-4 pr-12 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                      placeholder="0.00"
                      value={form.priceBase} 
                      onChange={(e) => setForm(prev => ({ ...prev, priceBase: e.target.value }))} 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock initial</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="1" 
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                    placeholder="0"
                    value={form.stock} 
                    onChange={(e) => setForm(prev => ({ ...prev, stock: e.target.value }))} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU (Référence)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-all outline-none"
                    placeholder="REF-001"
                    value={form.sku} 
                    onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))} 
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductEdit;