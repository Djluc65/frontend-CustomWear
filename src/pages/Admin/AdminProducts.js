import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiSearch, FiPackage, FiEdit2, FiChevronLeft, FiChevronRight, FiMoreVertical, FiX } from 'react-icons/fi';
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
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${statusObj.color}`}>
        {statusObj.label}
      </span>
    );
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Produits</h1>
          <p className="text-slate-500 mt-1">Gérez votre catalogue, vos stocks et vos prix.</p>
        </div>
        <Button onClick={() => navigate('/admin/products/create')} className="bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-sm">
          <FiPlus size={18} />
          Nouveau Produit
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-100 bg-white/50">
          <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:max-w-sm">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white border-slate-200 focus:ring-slate-900"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full sm:w-[180px]">
                <option value="all">Toutes catégories</option>
                {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </Select>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full sm:w-[150px]">
                <option value="all">Tous statuts</option>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              { (search || category !== 'all' || status !== 'all') && (
                <Button type="button" variant="ghost" onClick={handleClearFilters} className="text-slate-500 hover:text-slate-900">
                  <FiX className="mr-2 h-4 w-4" />
                  Effacer
                </Button>
              )}
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-2">Une erreur est survenue</div>
            <div className="text-sm text-slate-500">{error}</div>
            <Button variant="outline" onClick={() => fetchProducts()} className="mt-4">Réessayer</Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-medium">
                  <tr>
                    <th className="px-6 py-4">Produit</th>
                    <th className="px-6 py-4">Catégorie</th>
                    <th className="px-6 py-4">Prix</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <FiPackage className="h-10 w-10 text-slate-300 mb-3" />
                          <p className="font-medium text-slate-900">Aucun produit trouvé</p>
                          <p className="text-sm text-slate-500 mt-1">Essayez de modifier vos filtres</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              {product.images && product.images[0] ? (
                                <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-400">
                                  <FiPackage />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 truncate">{product.name}</div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">{product.sku || 'NO-SKU'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 capitalize">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {(product.price?.base ?? product.priceBase ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(product.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/products/${product._id}/edit`)} className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                              <FiEdit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(product._id)} className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50">
                              <FiTrash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {products.length === 0 ? (
                 <div className="px-6 py-16 text-center text-slate-500">
                    <FiPackage className="h-10 w-10 text-slate-300 mb-3 mx-auto" />
                    <p className="font-medium text-slate-900">Aucun produit trouvé</p>
                 </div>
              ) : (
                 products.map((product) => (
                   <div key={product._id} className="p-4 flex gap-4 items-start bg-white">
                     <div className="h-20 w-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                        {product.images && product.images[0] ? (
                          <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400">
                            <FiPackage size={24} />
                          </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0 space-y-2">
                       <div className="flex justify-between items-start gap-2">
                         <div className="min-w-0">
                           <h3 className="font-semibold text-slate-900 truncate text-sm leading-tight">{product.name}</h3>
                           <p className="text-xs text-slate-500 font-mono mt-0.5">{product.sku}</p>
                         </div>
                         <Button variant="ghost" size="sm" className="h-8 w-8 p-0 -mt-1 -mr-2 text-slate-400">
                            <FiMoreVertical />
                         </Button>
                       </div>
                       
                       <div className="flex items-center flex-wrap gap-2">
                         {getStatusBadge(product.status)}
                         <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full capitalize">
                           {product.category}
                         </span>
                       </div>

                       <div className="flex items-center justify-between pt-2">
                         <span className="font-bold text-slate-900">
                           {(product.price?.base ?? product.priceBase ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                         </span>
                         <div className="flex gap-1">
                           <Button variant="outline" size="sm" onClick={() => navigate(`/admin/products/${product._id}/edit`)} className="h-8 px-3 text-xs">
                             Modifier
                           </Button>
                           <Button variant="outline" size="sm" onClick={() => handleDelete(product._id)} className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                             <FiTrash2 size={14} />
                           </Button>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="text-sm text-slate-500 hidden sm:block">
                Affichage de <span className="font-medium text-slate-900">{(page - 1) * PAGE_SIZE + 1}</span> à <span className="font-medium text-slate-900">{Math.min(page * PAGE_SIZE, (page - 1) * PAGE_SIZE + products.length)}</span> résultats
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <Button variant="outline" size="sm" onClick={() => goPage(page - 1)} disabled={page <= 1} className="h-9 px-3 lg:px-4">
                  <FiChevronLeft className="mr-2 h-4 w-4" /> Précédent
                </Button>
                <span className="text-sm font-medium text-slate-900 sm:hidden">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => goPage(page + 1)} disabled={page >= totalPages} className="h-9 px-3 lg:px-4">
                  Suivant <FiChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminProducts;
