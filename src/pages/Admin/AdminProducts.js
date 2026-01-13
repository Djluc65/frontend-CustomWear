import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiSearch, FiPackage, FiRefreshCcw, FiEdit2, FiFilter, FiChevronLeft, FiChevronRight, FiMoreVertical, FiX } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Card } from '../../components/ui/card';

const CATEGORIES = [
  { slug: 't-shirts', name: 'T-shirts' },
  { slug: 'vestes', name: 'Vêstes' },
  { slug: 'casquettes', name: 'Casquettes' },
  { slug: 'bonnets', name: 'Bonnets' },
  { slug: 'vaisselle', name: 'Vaisselle' }
];

const STATUSES = [
  { value: 'draft', label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
  { value: 'active', label: 'Actif', color: 'bg-green-100 text-green-700' },
  { value: 'inactive', label: 'Inactif', color: 'bg-red-100 text-red-700' },
  { value: 'discontinued', label: 'Arrêté', color: 'bg-yellow-100 text-yellow-700' }
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
      
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) delete params[key];
      });
      
      const res = await adminAPI.getAllProducts(params);
      
      if (res?.data?.success && res?.data?.data) {
        const responseData = res.data.data;
        const products = responseData.products || [];
        const pagination = responseData.pagination || {};
        
        setProducts(Array.isArray(products) ? products : []);
        setTotalPages(pagination.totalPages || 1);
      } else {
        setProducts([]);
        setTotalPages(1);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors du chargement des produits';
      setError(msg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts({ page: 1 });
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
    return `Page ${page} / ${totalPages}`;
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

  const getStatusBadge = (s) => {
    const statusObj = STATUSES.find(st => st.value === s) || STATUSES[0];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusObj.color}`}>
        {statusObj.label}
      </span>
    );
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FiPackage className="text-blue-600" />
            Gestion des Produits
          </h1>
          <p className="text-slate-500 mt-1">Gérez votre catalogue, stocks et prix</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-600/20">
          <FiPlus size={20} />
          Nouveau Produit
        </Button>
      </div>

      <Card className="p-4 mb-8 bg-white border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher (nom, SKU)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="min-w-[140px]">
              <option value="all">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="min-w-[140px]">
              <option value="all">Tous statuts</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
            <Button type="button" variant="ghost" onClick={handleClearFilters} className="text-slate-500 hover:text-slate-700">
              <FiRefreshCcw />
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center">{error}</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Produit</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Catégorie</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Prix</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Statut</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Aucun produit trouvé</td></tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                            {product.images && product.images[0] ? (
                              <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <FiPackage className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{product.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{product.sku || 'NO-SKU'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 capitalize">{product.category}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{product.price?.base ?? product.priceBase ?? 0} €</td>
                      <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"><FiEdit2 /></Button>
                           <Button variant="ghost" size="sm" onClick={() => handleDelete(product._id)} className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"><FiTrash2 /></Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {products.length === 0 ? (
               <div className="text-center py-12 text-slate-500">Aucun produit trouvé</div>
            ) : (
               products.map((product) => (
                 <Card key={product._id} className="p-4 flex gap-4 items-start">
                   <div className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.images && product.images[0] ? (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FiPackage className="text-slate-400 text-2xl" />
                      )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start">
                       <div>
                         <h3 className="font-semibold text-slate-900 truncate pr-2">{product.name}</h3>
                         <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                       </div>
                       <button className="text-slate-400 hover:text-slate-600"><FiMoreVertical /></button>
                     </div>
                     <div className="flex items-center gap-2 mt-2">
                       {getStatusBadge(product.status)}
                       <span className="text-xs text-slate-500 capitalize">• {product.category}</span>
                     </div>
                     <div className="flex items-center justify-between mt-3">
                       <span className="font-bold text-slate-900">{product.price?.base ?? product.priceBase ?? 0} €</span>
                       <div className="flex gap-2">
                         <Button variant="outline" size="sm" className="h-8 w-8 p-0"><FiEdit2 size={14} /></Button>
                         <Button variant="outline" size="sm" onClick={() => handleDelete(product._id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"><FiTrash2 size={14} /></Button>
                       </div>
                     </div>
                   </div>
                 </Card>
               ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="outline" onClick={() => goPage(page - 1)} disabled={page <= 1} className="gap-2">
              <FiChevronLeft /> Précédent
            </Button>
            <span className="text-sm text-slate-600 font-medium">{paginatedLabel}</span>
            <Button variant="outline" onClick={() => goPage(page + 1)} disabled={page >= totalPages} className="gap-2">
              Suivant <FiChevronRight />
            </Button>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Nouveau Produit</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><FiX size={24}/></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nom du produit</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: T-Shirt Vintage" required />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Catégorie</label>
                   <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                     {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                   </Select>
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Prix de base (€)</label>
                   <Input type="number" step="0.01" value={form.priceBase} onChange={e => setForm({...form, priceBase: e.target.value})} required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description courte</label>
                <Input value={form.shortDescription} onChange={e => setForm({...form, shortDescription: e.target.value})} placeholder="Résumé pour les listes..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description complète</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  required
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                  Mettre en avant
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.status === 'active'} onChange={e => setForm({...form, status: e.target.checked ? 'active' : 'draft'})} className="rounded text-blue-600 focus:ring-blue-500" />
                  Actif immédiatement
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button type="submit" disabled={creating} className="bg-blue-600 text-white hover:bg-blue-700">
                  {creating ? 'Création...' : 'Créer le produit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
