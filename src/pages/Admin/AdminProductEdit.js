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
      <div className="admin-products-page" style={{ padding: '1.5rem' }}>
        <p>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="admin-products-page" style={{ padding: '1.5rem' }}>
      <div className="admin-products-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/admin/products" className="btn" style={{ textDecoration: 'none' }}>
            <FiArrowLeft /> Retour
          </Link>
          <h1 style={{ margin: 0 }}>Modifier le produit</h1>
        </div>
        <button className="btn-primary" form="edit-form" disabled={saving}>
          <FiSave /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {error && (
        <div className="error-state" style={{ marginBottom: 12 }}>
          <p style={{ color: '#b91c1c' }}>{error}</p>
        </div>
      )}

      <form id="edit-form" className="form-grid" onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Nom
          <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
        </label>
        <label className="full">
          Description
          <textarea rows={3} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
        </label>
        <label>
          Catégorie
          <select value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}>
            {CATEGORIES.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          Genre
          <select value={form.gender} onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))}>
            {GENDERS.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </label>
        <label>
          Prix de base (€)
          <input type="number" min="0" step="0.01" value={form.priceBase} onChange={(e) => setForm(prev => ({ ...prev, priceBase: e.target.value }))} />
        </label>
        <label>
          Statut
          <select value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="draft">Brouillon</option>
            <option value="discontinued">Arrêté</option>
          </select>
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))} />
          Mettre en avant
        </label>

        <div className="full">
          <div style={{ marginBottom: 6, fontWeight: 500 }}>Couleurs disponibles</div>
          <div className="checkbox-grid">
            {ALLOWED_COLORS.map(color => (
              <label key={color} className="checkbox-item">
                <input 
                  type="checkbox"
                  checked={form.colors.includes(color)}
                  onChange={() => toggleColor(color)}
                />
                <span>{color}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="full">
          <div style={{ marginBottom: 6, fontWeight: 500 }}>Tailles disponibles</div>
          <div className="checkbox-grid">
            {SIZE_OPTIONS.map(size => (
              <label key={size} className="checkbox-item">
                <input 
                  type="checkbox"
                  checked={form.sizes.includes(size)}
                  onChange={() => toggleSize(size)}
                />
                <span>{size}</span>
              </label>
            ))}
          </div>
        </div>

        <label>
          Stock (variant principal)
          <input type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm(prev => ({ ...prev, stock: e.target.value }))} />
        </label>

        <label>
          SKU
          <input type="text" value={form.sku} onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))} />
        </label>
      </form>
    </div>
  );
};

export default AdminProductEdit;