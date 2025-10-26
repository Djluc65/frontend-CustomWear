import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiUpload } from 'react-icons/fi';
import { adminAPI } from '../../services/api';

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

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

const AdminProductCreate = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    stock: ''
  });

  const [mainImages, setMainImages] = useState({ front: null, back: null });
  const [colorImages, setColorImages] = useState({}); // { 'Noir': { front, back } }

  const generateSku = (name) => {
    const base = (name || 'PRD').toString().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${base}-${Date.now().toString().slice(-4)}-${suffix}`;
  };

  const uploadSingleImage = async (file) => {
    const res = await adminAPI.uploadImages([file]);
    const asset = res?.data?.data?.assets?.[0];
    if (!asset) throw new Error('Upload image échoué');
    return asset; // { url, public_id }
  };

  const handleMainImageChange = async (side, file) => {
    if (!file) return;
    try {
      setUploading(true);
      const asset = await uploadSingleImage(file);
      setMainImages(prev => ({ ...prev, [side]: asset }));
    } catch (e) {
      window.alert(e?.message || 'Upload échoué');
    } finally {
      setUploading(false);
    }
  };

  const handleColorImageChange = async (color, side, file) => {
    if (!file) return;
    try {
      setUploading(true);
      const asset = await uploadSingleImage(file);
      setColorImages(prev => ({ ...prev, [color]: { ...(prev[color] || {}), [side]: asset } }));
    } catch (e) {
      window.alert(e?.message || 'Upload échoué');
    } finally {
      setUploading(false);
    }
  };

  const toggleColor = (color) => {
    setForm(prev => {
      const exists = prev.colors.includes(color);
      const colors = exists ? prev.colors.filter(c => c !== color) : [...prev.colors, color];
      if (exists) {
        setColorImages(ci => {
          const copy = { ...ci };
          delete copy[color];
          return copy;
        });
      } else {
        setColorImages(ci => ({ ...ci, [color]: ci[color] || { front: null, back: null } }));
      }
      return { ...prev, colors };
    });
  };

  const toggleSize = (size) => {
    setForm(prev => {
      const exists = prev.sizes.includes(size);
      const sizes = exists ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.priceBase) {
      window.alert('Veuillez renseigner le nom, la description et le prix de base');
      return;
    }
    if (!mainImages.front || !mainImages.back) {
      window.alert('Veuillez téléverser les images principales (avant et arrière)');
      return;
    }
    for (const c of form.colors) {
      const entry = colorImages[c] || {};
      if (!entry.front || !entry.back) {
        window.alert(`Veuillez téléverser avant et arrière pour la couleur: ${c}`);
        return;
      }
    }

    try {
      setCreating(true);
      const imagesPayload = [];
      imagesPayload.push({
        url: mainImages.front.secure_url || mainImages.front.url,
        publicId: mainImages.front.public_id || mainImages.front.publicId,
        isPrimary: true,
        side: 'front'
      });
      imagesPayload.push({
        url: mainImages.back.secure_url || mainImages.back.url,
        publicId: mainImages.back.public_id || mainImages.back.publicId,
        side: 'back'
      });
      for (const c of form.colors) {
        const entry = colorImages[c];
        imagesPayload.push({
          url: entry.front.secure_url || entry.front.url,
          publicId: entry.front.public_id || entry.front.publicId,
          color: c,
          side: 'front'
        });
        imagesPayload.push({
          url: entry.back.secure_url || entry.back.url,
          publicId: entry.back.public_id || entry.back.publicId,
          color: c,
          side: 'back'
        });
      }

      const payload = {
        name: form.name,
        description: form.description,
        shortDescription: form.shortDescription || '',
        category: form.category,
        gender: form.gender,
        sku: generateSku(form.name),
        images: imagesPayload,
        price: { base: Number(form.priceBase), currency: 'EUR' },
        colors: form.colors,
        sizes: form.sizes,
        status: form.status || 'active',
        featured: !!form.featured,
        stock: form.stock ? Number(form.stock) : undefined
      };

      const res = await adminAPI.createProduct(payload);
      const created = res?.data?.data || res?.data || payload;
      window.alert('Produit créé avec succès');
      navigate('/admin/products');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Création échouée';
      window.alert(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="admin-products-page" style={{ padding: '1.5rem' }}>
      <div className="admin-products-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/admin/products" className="btn" style={{ textDecoration: 'none' }}>
            <FiArrowLeft /> Retour
          </Link>
          <h1 style={{ margin: 0 }}>Créer un produit</h1>
        </div>
        <button className="btn-primary" form="create-form" disabled={creating || uploading}>
          <FiSave /> {creating ? 'Création…' : 'Enregistrer'}
        </button>
      </div>

      <form id="create-form" className="form-grid" onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Nom
          <input type="text" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
        </label>
        <label className="full">
          Description
          <textarea rows={3} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
        </label>
        <label>
          Description courte
          <input type="text" value={form.shortDescription} onChange={(e) => setForm(prev => ({ ...prev, shortDescription: e.target.value }))} />
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
          <input type="number" step="0.01" value={form.priceBase} onChange={(e) => setForm(prev => ({ ...prev, priceBase: e.target.value }))} />
        </label>
        <label>
          Stock global
          <input type="number" value={form.stock} onChange={(e) => setForm(prev => ({ ...prev, stock: e.target.value }))} />
        </label>

        <div className="full">
          <div style={{ marginTop: 8, marginBottom: 6, fontWeight: 600 }}>Images principales</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label>Avant (principale)
                <input type="file" accept="image/*" onChange={(e) => handleMainImageChange('front', e.target.files?.[0])} />
              </label>
              {mainImages.front && (
                <img alt="front" src={mainImages.front.secure_url || mainImages.front.url} style={{ marginTop: 8, width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6 }} />
              )}
            </div>
            <div>
              <label>Arrière
                <input type="file" accept="image/*" onChange={(e) => handleMainImageChange('back', e.target.files?.[0])} />
              </label>
              {mainImages.back && (
                <img alt="back" src={mainImages.back.secure_url || mainImages.back.url} style={{ marginTop: 8, width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6 }} />
              )}
            </div>
          </div>
        </div>

        <div className="full">
          <div style={{ marginTop: 8, marginBottom: 6, fontWeight: 600 }}>Tailles</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SIZE_OPTIONS.map(s => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={form.sizes.includes(s)} onChange={() => toggleSize(s)} /> {s}
              </label>
            ))}
          </div>
        </div>

        <div className="full">
          <div style={{ marginTop: 8, marginBottom: 6, fontWeight: 600 }}>Couleurs</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALLOWED_COLORS.map(c => (
              <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={form.colors.includes(c)} onChange={() => toggleColor(c)} /> {c}
              </label>
            ))}
          </div>
        </div>

        {form.colors.length > 0 && (
          <div className="full">
            <div style={{ marginTop: 8, marginBottom: 6, fontWeight: 600 }}>Images par couleur (avant et arrière)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {form.colors.map(c => (
                <div key={c} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{c}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label>Avant
                        <input type="file" accept="image/*" onChange={(e) => handleColorImageChange(c, 'front', e.target.files?.[0])} />
                      </label>
                      {colorImages[c]?.front && (
                        <img alt={`${c}-front`} src={colorImages[c].front.secure_url || colorImages[c].front.url} style={{ marginTop: 8, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 6 }} />
                      )}
                    </div>
                    <div>
                      <label>Arrière
                        <input type="file" accept="image/*" onChange={(e) => handleColorImageChange(c, 'back', e.target.files?.[0])} />
                      </label>
                      {colorImages[c]?.back && (
                        <img alt={`${c}-back`} src={colorImages[c].back.secure_url || colorImages[c].back.url} style={{ marginTop: 8, width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 6 }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="full" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Résumé</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <div><strong>Genre:</strong> {GENDERS.find(g => g.value === form.gender)?.label}</div>
            <div><strong>Couleurs:</strong> {form.colors.length ? form.colors.join(', ') : '—'}</div>
            <div><strong>Tailles:</strong> {form.sizes.length ? form.sizes.join(', ') : '—'}</div>
          </div>
        </div>

        <div className="full" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="submit" className="btn-primary" disabled={creating || uploading}>
            <FiUpload /> {creating ? 'Création…' : 'Créer le produit'}
          </button>
          {uploading && <span>Upload en cours…</span>}
        </div>
      </form>
    </div>
  );
};

export default AdminProductCreate;