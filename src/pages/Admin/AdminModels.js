import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiLayers,
  FiImage,
  FiUpload,
  FiX,
  FiChevronUp
} from 'react-icons/fi';
import { modelsAPI, adminAPI, productsAPI } from '../../services/api';
import './AdminModels.css';

const ALLOWED_TYPES = ['t-shirt', 'sweat', 'hoodie', 'casquette', 'mug'];
const ALLOWED_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
const ALLOWED_COLORS = ['Noir', 'Blanc', 'Bleu', 'Vert', 'Jaune', 'Rouge', 'Mauve', 'Rose', 'Marron'];
const ALLOWED_GENDERS = ['unisexe', 'homme', 'femme', 'enfant'];

// Catégories demandées pour l’admin (labels spécifiques)
const PREFERRED_CATEGORIES = [
  { slug: 't-shirts', name: 'T-shirts' },
  { slug: 'vestes', name: 'Vêstes' },
  { slug: 'casquettes', name: 'Casquettes' },
  { slug: 'bonnets', name: 'Bonnets' },
  { slug: 'vaisselles', name: 'Vaisselles' }
];

const AdminModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState([]);
  const [sizeFilter, setSizeFilter] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 't-shirt',
    category: '',
    gender: 'unisexe',
    basePrice: '',
    sizes: ['S', 'M', 'L'],
    colors: ['Noir', 'Blanc'],
    images: { front: '', back: '' },
    imagesByColor: {},
    active: true
  });
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview, setBackPreview] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  // États pour gestion des uploads par couleur
  const [colorSideFiles, setColorSideFiles] = useState({}); // { [color]: { front: File|null, back: File|null } }
  const [colorSidePreviews, setColorSidePreviews] = useState({}); // { [color]: { front: string|null, back: string|null } }

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        const res = await modelsAPI.getModels({});
        const items = res?.data?.data || res?.data || [];
        setModels(Array.isArray(items) ? items : []);
        setError(null);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    loadModels();
  }, []);

  // Chargement des catégories pour les filtres et le formulaire
  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await productsAPI.getCategories();
        const data = res?.data;
        const raw = data?.data?.categories || data?.categories || data?.data || [];
        const cats = Array.isArray(raw)
          ? raw.map(c => {
              const slug = String(c.slug || '').trim();
              const name = c.name || c.slug || '';
              const finalSlug = slug ? slug.toLowerCase() : slugify(name);
              return { slug: finalSlug, name };
            })
          : [];
        if (!cancelled) {
          // Toujours afficher les catégories demandées (labels spécifiques)
          setCategories(PREFERRED_CATEGORIES);
          setCategoriesError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setCategoriesError(err?.response?.data?.message || err?.message || 'Erreur de chargement des catégories');
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };
    loadCategories();
    return () => { cancelled = true; };
  }, []);

  // Afficher le bouton "remonter" selon la position de scroll
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleColorFilter = (color) => {
    setColorFilter(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };
  const toggleSizeFilter = (size) => {
    setSizeFilter(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const filteredModels = models.filter(m => {
    const name = (m?.name || '').toLowerCase();
    const type = (m?.type || '').toLowerCase();
    const gender = (m?.gender || '').toLowerCase();
    const category = toCategorySlug(m?.category || '');
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || type === typeFilter;
    const matchesGender = genderFilter === 'all' || gender === genderFilter;
    const matchesCategory = categoryFilter === 'all' || category === String(categoryFilter).toLowerCase();
    const matchesColor = colorFilter.length === 0 || (Array.isArray(m.colors) && m.colors.some(c => colorFilter.includes(c)));
    const matchesSize = sizeFilter.length === 0 || (Array.isArray(m.sizes) && m.sizes.some(s => sizeFilter.includes(s)));
    return matchesSearch && matchesType && matchesGender && matchesCategory && matchesColor && matchesSize;
  });

  const handleAddModel = () => {
    setEditingModel(null);
    setForm({
      name: '',
      type: 't-shirt',
      category: '',
      gender: 'unisexe',
      basePrice: '',
      sizes: ['S', 'M', 'L'],
      colors: ['Noir', 'Blanc'],
      images: { front: '', back: '' },
      imagesByColor: {},
      active: true
    });
    setFrontFile(null);
    setBackFile(null);
    setFrontPreview('');
    setBackPreview('');
    setColorSideFiles({});
    setColorSidePreviews({});
    setShowModal(true);
  };

  const handleEditModel = (model) => {
    setEditingModel(model);
    setForm({
      name: model?.name || '',
      type: model?.type || 't-shirt',
      category: toCategorySlug(model?.category || ''),
      gender: (model?.gender || 'unisexe'),
      basePrice: String(model?.basePrice ?? ''),
      sizes: Array.isArray(model?.sizes) ? model.sizes : [],
      colors: Array.isArray(model?.colors) ? model.colors : [],
      images: model?.images || { front: '', back: '' },
      imagesByColor: model?.imagesByColor || {},
      active: !!model?.active
    });
    setFrontFile(null);
    setBackFile(null);
    setFrontPreview(model?.images?.front || '');
    setBackPreview(model?.images?.back || '');
    setColorSideFiles({});
    setColorSidePreviews({});
    setShowModal(true);
  };

  const closeModal = () => {
    if (frontPreview && frontPreview.startsWith('blob:')) URL.revokeObjectURL(frontPreview);
    if (backPreview && backPreview.startsWith('blob:')) URL.revokeObjectURL(backPreview);
    // Révoquer toutes les URLs blob des aperçus par couleur
    try {
      Object.values(colorSidePreviews).forEach(sides => {
        const urls = [sides?.front, sides?.back].filter(Boolean);
        urls.forEach(url => {
          if (url && typeof url === 'string' && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
      });
    } catch (_) {}
    setFrontPreview('');
    setBackPreview('');
    setFrontFile(null);
    setBackFile(null);
    setColorSideFiles({});
    setColorSidePreviews({});
    setShowModal(false);
    setEditingModel(null);
  };

  const toggleSize = (size) => {
    setForm(prev => {
      const has = prev.sizes.includes(size);
      return { ...prev, sizes: has ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size] };
    });
  };

  const toggleColor = (color) => {
    setForm(prev => {
      const has = prev.colors.includes(color);
      const nextColors = has ? prev.colors.filter(c => c !== color) : [...prev.colors, color];
      // Si on retire une couleur, nettoyer ses états
      if (has) {
        // Révoquer les blobs
        const sides = colorSidePreviews[color] || {};
        [sides?.front, sides?.back].forEach(url => {
          if (url && url.startsWith('blob:')) {
            try { URL.revokeObjectURL(url); } catch (_) {}
          }
        });
        const { [color]: _, ...restSideFiles } = colorSideFiles;
        const { [color]: __, ...restSidePreviews } = colorSidePreviews;
        const { [color]: ___, ...restImagesByColor } = prev.imagesByColor || {};
        setColorSideFiles(restSideFiles);
        setColorSidePreviews(restSidePreviews);
        return { ...prev, colors: nextColors, imagesByColor: restImagesByColor };
      }
      return { ...prev, colors: nextColors };
    });
  };

  const handleFileChange = (side, file) => {
    if (!file) return;
    if (side === 'front') {
      setFrontFile(file);
      const url = URL.createObjectURL(file);
      setFrontPreview(url);
    } else {
      setBackFile(file);
      const url = URL.createObjectURL(file);
      setBackPreview(url);
    }
  };

  // Permet d’uploader plusieurs images d’un coup et de remplir front/back
  const handleMultiFilesUpload = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    try {
      if (frontPreview && frontPreview.startsWith('blob:')) URL.revokeObjectURL(frontPreview);
      if (backPreview && backPreview.startsWith('blob:')) URL.revokeObjectURL(backPreview);

      const f1 = files[0];
      if (f1) {
        setFrontFile(f1);
        const url1 = URL.createObjectURL(f1);
        setFrontPreview(url1);
      }

      const f2 = files[1];
      if (f2) {
        setBackFile(f2);
        const url2 = URL.createObjectURL(f2);
        setBackPreview(url2);
      }
    } catch (err) {
      console.error('[AdminModels] handleMultiFilesUpload error:', err);
    }
  };

  // Gestion des uploads spécifiques par couleur et par côté (avant/arrière)
  const handleColorSideFileChange = (color, side, file) => {
    if (!file) return;
    // Révoquer ancien blob si présent
    const prevUrl = colorSidePreviews[color]?.[side];
    if (prevUrl && typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(prevUrl); } catch (_) {}
    }
    const blobUrl = URL.createObjectURL(file);
    setColorSideFiles(prev => ({
      ...prev,
      [color]: { ...(prev[color] || {}), [side]: file }
    }));
    setColorSidePreviews(prev => ({
      ...prev,
      [color]: { ...(prev[color] || {}), [side]: blobUrl }
    }));
  };

  const clearColorSidePreview = (color, side) => {
    const prevUrl = colorSidePreviews[color]?.[side];
    if (prevUrl && typeof prevUrl === 'string' && prevUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(prevUrl); } catch (_) {}
    }
    setColorSideFiles(prev => ({
      ...prev,
      [color]: { ...(prev[color] || {}), [side]: null }
    }));
    setColorSidePreviews(prev => ({
      ...prev,
      [color]: { ...(prev[color] || {}), [side]: '' }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const rawPrice = String(form.basePrice || '').replace(',', '.');
      const parsedPrice = parseFloat(rawPrice);
      if (Number.isNaN(parsedPrice)) {
        throw new Error('Prix invalide. Utilisez 12,50 ou 12.50');
      }

      const payload = {
        name: (form.name || '').trim(),
        type: form.type,
        category: toCategorySlug(form.category),
        gender: form.gender,
        basePrice: parsedPrice,
        sizes: form.sizes,
        colors: form.colors,
        images: { ...form.images },
        active: !!form.active,
      };

      // Upload des images si des fichiers ont été sélectionnés pour front/back
      if (frontFile || backFile) {
        const files = [];
        const mapping = [];
        if (frontFile) { files.push(frontFile); mapping.push('front'); }
        if (backFile) { files.push(backFile); mapping.push('back'); }

        const uploadRes = await adminAPI.uploadImages(files);
        const urls = uploadRes?.data?.data?.urls || uploadRes?.data?.urls || [];
        mapping.forEach((side, idx) => {
          payload.images[side] = urls[idx] || payload.images[side];
        });
      }

      // Construire imagesByColor au format { color: { front, back } }
      const imagesByColor = { ...(form.imagesByColor || {}) };
      for (const color of form.colors) {
        const current = imagesByColor[color] || {};
        const sidesToUpload = [];
        const mapping = [];
        const frontColorFile = colorSideFiles[color]?.front;
        const backColorFile = colorSideFiles[color]?.back;
        if (frontColorFile) { sidesToUpload.push(frontColorFile); mapping.push('front'); }
        if (backColorFile) { sidesToUpload.push(backColorFile); mapping.push('back'); }
        if (sidesToUpload.length > 0) {
          const resUp = await adminAPI.uploadImages(sidesToUpload);
          const urls = resUp?.data?.data?.urls || resUp?.data?.urls || [];
          mapping.forEach((side, idx) => {
            current[side] = urls[idx] || current[side];
          });
        }
        imagesByColor[color] = current;
      }
      payload.imagesByColor = imagesByColor;

      if (editingModel?._id) {
        const res = await modelsAPI.updateModel(editingModel._id, payload);
        window.alert('Modèle mis à jour');
        // Mettre à jour localement
        const updated = res?.data?.data || res?.data;
        setModels(prev => prev.map(m => m._id === editingModel._id ? (updated || { ...m, ...payload }) : m));
      } else {
        const res = await modelsAPI.createModel(payload);
        window.alert('Modèle créé');
        const created = res?.data?.data || res?.data;
        setModels(prev => [created || payload, ...prev]);
      }

      closeModal();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la sauvegarde';
      console.error('[AdminModels] save error:', msg, err);
      window.alert(msg);
    }
  };

  const handleDelete = async (modelId) => {
    if (!window.confirm('Supprimer ce modèle ?')) return;
    try {
      await modelsAPI.deleteModel(modelId);
      setModels(prev => prev.filter(m => m._id !== modelId));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la suppression';
      console.error('[AdminModels] delete error:', msg, err);
      window.alert(msg);
    }
  };

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function slugify(s) { return String(s || '').trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'); }
  function toCategorySlug(value) {
    if (!value) return '';
    const lower = String(value).toLowerCase();
    const found = Array.isArray(categories)
      ? categories.find(cat => cat.slug === lower || (cat.name || '').toLowerCase() === lower)
      : null;
    return found?.slug || slugify(lower);
  }
  function getCategoryLabel(value) {
    if (!value) return '-';
    const lowerSlug = toCategorySlug(value);
    const found = categories.find(cat => cat.slug === lowerSlug);
    return found?.name || value;
  }

  return (
    <div className="admin-models">
      <div className="models-header">
        <div className="header-left">
          <h1>Modèles de produits</h1>
          <p>Gérez les modèles (tailles, couleurs, images et prix).</p>
        </div>
        <button className="add-model-btn" onClick={handleAddModel}>
          <FiPlus />
          <span>Nouveau modèle</span>
        </button>
      </div>

      <div className="models-filters">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher un modèle..." 
            className="search-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <span className="filter-label">Type :</span>
          <select 
            className="type-filter" 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Tous</option>
            {ALLOWED_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Genre :</span>
          <select 
            className="type-filter" 
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="all">Tous</option>
            {ALLOWED_GENDERS.map(g => (
              <option key={g} value={g}>{capitalize(g)}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Catégorie :</span>
          <select 
            className="type-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={categoriesLoading}
          >
            <option value="all">Toutes</option>
            {categories.map(cat => (
              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Panneau Liste des catégories */}
      <div className="categories-panel" aria-label="Liste des catégories">
        <div className="panel-header">
          <FiLayers />
          <span>Liste des catégories</span>
        </div>
        {categoriesLoading && (
          <div className="panel-loading">Chargement des catégories...</div>
        )}
        {categoriesError && (
          <div className="panel-error">{categoriesError}</div>
        )}
        {!categoriesLoading && !categoriesError && (
          <div className="categories-chips">
            <button
              type="button"
              className={`chip ${categoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('all')}
              aria-label="Toutes les catégories"
            >
              Toutes
            </button>
            {categories.map(cat => {
              const value = cat.slug;
              const isActive = String(categoryFilter).toLowerCase() === value;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  className={`chip ${isActive ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(value)}
                  aria-label={`Catégorie ${cat.name}`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Panneau Filtres Couleurs */}
      <div className="categories-panel" aria-label="Filtres couleurs">
        <div className="panel-header">
          <FiLayers />
          <span>Filtres couleurs</span>
        </div>
        <div className="categories-chips">
          <button
            type="button"
            className={`chip ${colorFilter.length === 0 ? 'active' : ''}`}
            onClick={() => setColorFilter([])}
            aria-label="Toutes les couleurs"
          >
            Toutes
          </button>
          {ALLOWED_COLORS.map(color => (
            <button
              key={color}
              type="button"
              className={`chip ${colorFilter.includes(color) ? 'active' : ''}`}
              onClick={() => toggleColorFilter(color)}
              aria-label={`Couleur ${color}`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Panneau Filtres Tailles */}
      <div className="categories-panel" aria-label="Filtres tailles">
        <div className="panel-header">
          <FiLayers />
          <span>Filtres tailles</span>
        </div>
        <div className="categories-chips">
          <button
            type="button"
            className={`chip ${sizeFilter.length === 0 ? 'active' : ''}`}
            onClick={() => setSizeFilter([])}
            aria-label="Toutes les tailles"
          >
            Toutes
          </button>
          {ALLOWED_SIZES.map(size => (
            <button
              key={size}
              type="button"
              className={`chip ${sizeFilter.includes(size) ? 'active' : ''}`}
              onClick={() => toggleSizeFilter(size)}
              aria-label={`Taille ${size}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="models-table-container">
        <table className="models-table">
          <thead>
            <tr>
              <th>Modèle</th>
              <th>Type</th>
              <th>Catégorie</th>
              <th>Genre</th>
              <th>Prix base</th>
              <th>Couleurs</th>
              <th>Tailles</th>
              <th>Actif</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9}>Chargement...</td></tr>
            )}
            {!loading && filteredModels.length === 0 && (
              <tr><td colSpan={9}>Aucun modèle</td></tr>
            )}
            {!loading && filteredModels.map((m) => (
              <tr key={m._id}>
                <td>
                  <div className="model-cell">
                    <div className="model-image">
                      {m?.images?.front ? (
                        <img src={m.images.front} alt={m.name} />
                      ) : (
                        <FiImage className="no-image" />
                      )}
                    </div>
                    <div className="model-details">
                      <h4>{m.name}</h4>
                      <div className="model-sub">
                        <span>Front/Back</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td><span className="type-tag">{m.type}</span></td>
                <td><span className="category-tag">{getCategoryLabel(m.category) || '-'}</span></td>
                <td><span className="gender-tag">{capitalize(m.gender || '-')}</span></td>
                <td className="price-cell">{Number(m.basePrice).toFixed(2)} €</td>
                <td>
                  <div className="colors-list">
                    {Array.isArray(m.colors) && m.colors.map((c) => (
                      <span key={c} className="color-pill">{c}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="sizes-list">
                    {Array.isArray(m.sizes) && m.sizes.map((s) => (
                      <span key={s} className="size-pill">{s}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${m.active ? 'status-active' : 'status-inactive'}`}>
                    {m.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="action-btn" onClick={() => handleEditModel(m)}>
                      <FiEdit2 />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(m._id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>{editingModel ? 'Modifier le modèle' : 'Nouveau modèle'}</h3>
                <button className="close-btn" onClick={closeModal}><FiX /></button>
              </div>

              <form className="modal-body" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nom</label>
                    <input 
                      type="text" 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Type</label>
                    <select 
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      required
                    >
                      {ALLOWED_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Catégorie</label>
                    <select 
                      value={toCategorySlug(form.category)}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                      disabled={categoriesLoading}
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      {categories.map(cat => (
                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                    {categoriesError && <small className="error-text">{categoriesError}</small>}
                  </div>

                  <div className="form-group">
                    <label>Genre</label>
                    <select 
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      required
                    >
                      {ALLOWED_GENDERS.map(g => (
                        <option key={g} value={g}>{capitalize(g)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Prix de base (€)</label>
                    <input 
                      type="text" 
                      value={form.basePrice} 
                      onChange={(e) => setForm({ ...form, basePrice: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group full">
                    <label>Tailles disponibles</label>
                    <div className="checkbox-grid">
                      {ALLOWED_SIZES.map(size => (
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

                  <div className="form-group full">
                    <label>Couleurs disponibles</label>
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

                  {/* Nouvelles sections d'upload par couleur (avant / arrière) */}
                  <div className="form-group full">
                    <label>Images par couleur</label>
                    {form.colors.length === 0 && (
                      <small className="help-text">Sélectionnez au moins une couleur pour ajouter des images spécifiques.</small>
                    )}
                    {form.colors.map((color) => (
                      <div key={color} className="color-section">
                        <div className="color-section-header">
                          <span className="color-section-title">{color}</span>
                        </div>
                        <div className="color-side-grid">
                          {/* Avant */}
                          <div className="color-side">
                            <div className="color-side-label">Avant</div>
                            <div className="color-side-preview">
                              {colorSidePreviews[color]?.front ? (
                                <img src={colorSidePreviews[color]?.front} alt={`Aperçu ${color} avant`} />
                              ) : form.imagesByColor?.[color]?.front ? (
                                <img src={form.imagesByColor[color].front} alt={`Image ${color} avant`} />
                              ) : (
                                <FiImage className="no-image" />
                              )}
                            </div>
                            <div className="color-side-actions">
                              <label className="upload-btn">
                                <FiUpload />
                                <span>Uploader avant</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleColorSideFileChange(color, 'front', e.target.files?.[0])}
                                  hidden
                                />
                              </label>
                              {colorSidePreviews[color]?.front && (
                                <button type="button" className="btn-secondary" onClick={() => clearColorSidePreview(color, 'front')}>
                                  <FiX /> Retirer
                                </button>
                              )}
                            </div>
                            <input 
                              type="text" 
                              placeholder="Ou URL avant"
                              value={form.imagesByColor?.[color]?.front || ''}
                              onChange={(e) => setForm(prev => ({
                                ...prev,
                                imagesByColor: {
                                  ...(prev.imagesByColor || {}),
                                  [color]: { ...(prev.imagesByColor?.[color] || {}), front: e.target.value }
                                }
                              }))}
                            />
                          </div>
                          {/* Arrière */}
                          <div className="color-side">
                            <div className="color-side-label">Arrière</div>
                            <div className="color-side-preview">
                              {colorSidePreviews[color]?.back ? (
                                <img src={colorSidePreviews[color]?.back} alt={`Aperçu ${color} arrière`} />
                              ) : form.imagesByColor?.[color]?.back ? (
                                <img src={form.imagesByColor[color].back} alt={`Image ${color} arrière`} />
                              ) : (
                                <FiImage className="no-image" />
                              )}
                            </div>
                            <div className="color-side-actions">
                              <label className="upload-btn">
                                <FiUpload />
                                <span>Uploader arrière</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleColorSideFileChange(color, 'back', e.target.files?.[0])}
                                  hidden
                                />
                              </label>
                              {colorSidePreviews[color]?.back && (
                                <button type="button" className="btn-secondary" onClick={() => clearColorSidePreview(color, 'back')}>
                                  <FiX /> Retirer
                                </button>
                              )}
                            </div>
                            <input 
                              type="text" 
                              placeholder="Ou URL arrière"
                              value={form.imagesByColor?.[color]?.back || ''}
                              onChange={(e) => setForm(prev => ({
                                ...prev,
                                imagesByColor: {
                                  ...(prev.imagesByColor || {}),
                                  [color]: { ...(prev.imagesByColor?.[color] || {}), back: e.target.value }
                                }
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-group full">
                    <label>Uploader en bloc (Front & Back)</label>
                    <label className="upload-btn">
                      <FiUpload />
                      <span>Uploader 2 images</span>
                      <input 
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleMultiFilesUpload(e.target.files)}
                        hidden
                      />
                    </label>
                    <small className="help-text">Le premier fichier devient l’avant, le second l’arrière.</small>
                  </div>

                  <div className="form-group">
                    <label>Image avant</label>
                    <div className="image-upload">
                      <div className="image-preview">
                        {frontPreview ? (
                          <img src={frontPreview} alt="Aperçu avant" />
                        ) : form.images.front ? (
                          <img src={form.images.front} alt="Aperçu avant" />
                        ) : (
                          <FiImage className="no-image" />
                        )}
                      </div>
                      <label className="upload-btn">
                        <FiUpload />
                        <span>Uploader</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileChange('front', e.target.files?.[0])}
                          hidden
                        />
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ou URL image"
                        value={form.images.front}
                        onChange={(e) => setForm({ ...form, images: { ...form.images, front: e.target.value } })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Image arrière</label>
                    <div className="image-upload">
                      <div className="image-preview">
                        {backPreview ? (
                          <img src={backPreview} alt="Aperçu arrière" />
                        ) : form.images.back ? (
                          <img src={form.images.back} alt="Aperçu arrière" />
                        ) : (
                          <FiImage className="no-image" />
                        )}
                      </div>
                      <label className="upload-btn">
                        <FiUpload />
                        <span>Uploader</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileChange('back', e.target.files?.[0])}
                          hidden
                        />
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ou URL image"
                        value={form.images.back}
                        onChange={(e) => setForm({ ...form, images: { ...form.images, back: e.target.value } })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Statut</label>
                    <select 
                      value={form.active ? 'active' : 'inactive'}
                      onChange={(e) => setForm({ ...form, active: e.target.value === 'active' })}
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeModal}>Annuler</button>
                  <button type="submit" className="btn-primary">{editingModel ? 'Mettre à jour' : 'Créer'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {showScrollTop && (
        <button className="scroll-top-btn" onClick={handleScrollTop} aria-label="Remonter">
          <FiChevronUp />
        </button>
      )}
    </div>
  );
};

export default AdminModels;