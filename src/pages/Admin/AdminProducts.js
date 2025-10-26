import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiTrash2, FiSearch, FiPackage, FiRefreshCcw, FiEdit2 } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import './AdminProducts.css';

const CATEGORIES = [
  { slug: 't-shirts', name: 'T-shirts' },
  { slug: 'vestes', name: 'Vêstes' },
  { slug: 'casquettes', name: 'Casquettes' },
  { slug: 'bonnets', name: 'Bonnets' },
  { slug: 'vaisselle', name: 'Vaisselle' }
];

const STATUSES = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'discontinued', label: 'Arrêté' }
];

const PAGE_SIZE = 12;

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: 't-shirts',
    priceBase: '',
    featured: false,
    status: 'draft'
  });

  const fetchProducts = async (opts = {}) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        search: (opts.search ?? search) || undefined,
        category: (opts.category ?? category) !== 'all' ? (opts.category ?? category) : undefined,
        status: (opts.status ?? status) !== 'all' ? (opts.status ?? status) : undefined,
        page: opts.page ?? page,
        limit: PAGE_SIZE
      };
      
      // Clean up undefined params
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });
      
      const res = await adminAPI.getAllProducts(params);
      
      // Handle the response format from backend: { success: true, data: { products: [...], pagination: {...} } }
      if (res?.data?.success && res?.data?.data) {
        const responseData = res.data.data;
        const products = responseData.products || [];
        const pagination = responseData.pagination || {};
        
        setProducts(Array.isArray(products) ? products : []);
        setTotalPages(pagination.totalPages || 1);
      } else {
        // Fallback for unexpected response format
        console.warn('[AdminProducts] Unexpected response format:', res?.data);
        setProducts([]);
        setTotalPages(1);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors du chargement des produits';
      console.error('[AdminProducts] fetch error:', msg);
      setError(msg);
      setProducts([]); // Ensure products is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts({ page: 1 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts({ page: 1, search });
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('all');
    setStatus('all');
    setPage(1);
    fetchProducts({ search: '', category: 'all', status: 'all', page: 1 });
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Supprimer ce produit ? Cette action est irréversible.');
    if (!ok) return;
    try {
      await adminAPI.deleteProduct(id);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Suppression échouée';
      window.alert(msg);
    }
  };

  const generateSku = (name) => {
    const base = (name || 'PRD').toString().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${base}-${Date.now().toString().slice(-4)}-${suffix}`;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.priceBase) {
      window.alert('Veuillez renseigner le nom, la description et le prix de base');
      return;
    }
    try {
      setCreating(true);
      const payload = {
        name: form.name,
        description: form.description,
        shortDescription: form.shortDescription || '',
        category: form.category,
        gender: 'unisexe',
        brand: '',
        sku: generateSku(form.name),
        images: [],
        price: { base: Number(form.priceBase), currency: 'EUR' },
        variants: [],
        customization: { isCustomizable: false, options: {} },
        specifications: {},
        seo: {},
        tags: [],
        status: form.status || 'draft',
        featured: !!form.featured
      };
      const res = await adminAPI.createProduct(payload);
      const created = res?.data?.data || res?.data || payload;
      setProducts(prev => [created, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '', shortDescription: '', category: 't-shirts', priceBase: '', featured: false, status: 'draft' });
      window.alert('Produit créé (brouillon)');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Création échouée';
      window.alert(msg);
    } finally {
      setCreating(false);
    }
  };

  const paginatedLabel = useMemo(() => {
    const current = page;
    const total = totalPages;
    return `Page ${current} / ${total}`;
  }, [page, totalPages]);

  const goPage = (next) => {
    const newPage = Math.max(1, Math.min(totalPages, next));
    setPage(newPage);
    fetchProducts({ page: newPage });
  };

  const formatDate = (d) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return '-'; }
  };

  const renderSizes = (p) => {
    if (Array.isArray(p?.sizes) && p.sizes.length) return p.sizes.join(', ');
    if (Array.isArray(p?.variants) && p.variants.length) {
      const uniq = Array.from(new Set(p.variants.map(v => v.size).filter(Boolean)));
      return uniq.length ? uniq.join(', ') : '-';
    }
    return '-';
  };

  return (
    <div className="admin-products-page">
      <div className="admin-products-header">
        <div className="title">
          <FiPackage />
          <h1>Produits</h1>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleClearFilters} title="Réinitialiser">
            <FiRefreshCcw />
            Réinitialiser
          </button>
          <Link to="/admin/products/new" className="btn-primary" style={{ textDecoration: 'none' }}>
            <FiPlus />
            Ajouter un produit
          </Link>
        </div>
      </div>

      <form className="filters-bar" onSubmit={handleSearchSubmit}>
        <div className="search-input">
          <FiSearch className="icon" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, description, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filters-group">
          <label>
            Catégorie
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">Toutes</option>
              {CATEGORIES.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Statut
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Tous</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn">
            Filtrer
          </button>
        </div>
      </form>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Chargement des produits…</p>
        </div>
      )}
      {error && (
        <div className="error-state">
          <h3>Erreur</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="products-table-wrapper">
          {products.length === 0 ? (
            <div className="no-products">
              <h3>Aucun produit</h3>
              <p>Essayez d’ajouter un produit ou de modifier les filtres.</p>
            </div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Taille</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Date d’ajout</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="prod-cell">
                        <div className="prod-image">
                          {p?.primaryImage?.url ? (
                            <img src={p.primaryImage.url} alt={p.name} />
                          ) : (
                            <div className="no-image" />
                          )}
                        </div>
                        <div className="prod-meta">
                          <div className="prod-name">{p.name}</div>
                          <div className="prod-sku">SKU: {p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td>{typeof p.category === 'object' ? (p.category?.name || '-') : (p.category || '-')}</td>
                    <td>{renderSizes(p)}</td>
                    <td className="price-cell">{Number(p?.price?.base ?? 0).toFixed(2)} €</td>
                    <td>{p.totalStock ?? 0}</td>
                    <td>{formatDate(p.createdAt)}</td>
                    <td>
                      <span className={`status-badge ${((p.status || '').toLowerCase() === 'active') ? 'status-active' : 'status-inactive'}`}>
                        {((p.status || '').toLowerCase() === 'active') ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <Link to={`/admin/products/${p._id}/edit`} className="action-btn" title="Modifier" style={{ textDecoration: 'none' }}>
                        <FiEdit2 />
                      </Link>
                      <button className="action-btn delete" title="Supprimer" onClick={() => handleDelete(p._id)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="pagination">
        <button className="btn" onClick={() => goPage(page - 1)} disabled={page <= 1}>Précédent</button>
        <span className="page-label">{paginatedLabel}</span>
        <button className="btn" onClick={() => goPage(page + 1)} disabled={page >= totalPages}>Suivant</button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Créer un produit (brouillon)</h2>
            <form className="form-grid" onSubmit={handleCreate}>
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
                Prix de base (€)
                <input type="number" min="0" step="0.01" value={form.priceBase} onChange={(e) => setForm(prev => ({ ...prev, priceBase: e.target.value }))} />
              </label>
              <label>
                Statut
                <select value={form.status} onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}>
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))} />
                Mettre en avant
              </label>

              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowCreate(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Création…' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;