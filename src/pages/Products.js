import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiGrid, FiList } from 'react-icons/fi';
import ProductCard from '../components/Products/ProductCard';
import { fetchProducts, setFilters, clearFilters } from '../store/slices/productsSlice';
import './Products.css';

// Utilitaire: déduire un slug de catégorie compatible
const getCategorySlug = (cat) => {
  const raw = (cat?.slug || cat?.id || cat?.name || '').toString();
  const norm = raw.trim().toLowerCase().replace(/\s+/g, '-');
  return norm === 'tshirts' ? 't-shirts' : norm;
};

const Products = () => {
  const dispatch = useDispatch();
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { 
    products, 
    loading, 
    error, 
    filters, 
    pagination,
    categories 
  } = useSelector(state => state.products);

  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get('search') || '',
    category: category || searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    featured: searchParams.get('featured') === 'true',
    inStock: searchParams.get('inStock') === 'true'
  });

  // Synchroniser le filtre de catégorie avec l'URL lorsque l'utilisateur
  // clique sur une catégorie dans la barre de navigation.
  useEffect(() => {
    const slugFromUrl = (category || '').toString();
    setLocalFilters(prev => (
      prev.category === slugFromUrl
        ? prev
        : { ...prev, category: slugFromUrl }
    ));
  }, [category]);

  useEffect(() => {
    // Mettre à jour les filtres dans le store
    dispatch(setFilters(localFilters));
    
    // Mettre à jour l'URL
    const params = new URLSearchParams();
    Object.entries(localFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });
    setSearchParams(params);
    
    // Charger les produits avec filtres pertinents
    dispatch(fetchProducts({
      category: localFilters.category || '',
      search: localFilters.search || '',
      minPrice: localFilters.minPrice || '',
      maxPrice: localFilters.maxPrice || '',
      featured: localFilters.featured || false,
      inStock: localFilters.inStock || false,
      minRating: localFilters.minRating || '',
      page: 1,
      limit: 12
    }));
  }, [dispatch, localFilters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setLocalFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      featured: false,
      inStock: false
    });
    dispatch(clearFilters());
  };

  const handleLoadMore = () => {
    if (pagination.hasNextPage) {
      dispatch(fetchProducts({
        category: localFilters.category || '',
        search: localFilters.search || '',
        page: (pagination.currentPage || 1) + 1,
        limit: 12
      }));
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="products-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des produits...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-error">
        <h2>Erreur lors du chargement</h2>
        <p>{error}</p>
        <button onClick={() => dispatch(fetchProducts({
          category: localFilters.category || '',
          search: localFilters.search || ''
        }))}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="products-header">
        <div className="products-title">
          <h1>
            {category ? `Catégorie: ${category}` : 'Tous nos produits'}
          </h1>
          <p>{pagination.total} produit{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}</p>
        </div>
        
        <div className="products-controls">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un produit (titre, description, tags)"
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            Filtres
          </button>
          
          <div className="view-controls">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <FiGrid />
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {/* Filtres rapides par catégories */}
      <div className="category-quick">
        <button
          className={`category-chip ${!localFilters.category ? 'active' : ''}`}
          onClick={() => handleFilterChange('category', '')}
        >
          Tous
        </button>
        {categories.map((cat) => {
          const slug = getCategorySlug(cat);
          const isActive = (localFilters.category || '') === slug;
          return (
            <button
              key={cat._id || cat.id || slug}
              className={`category-chip ${isActive ? 'active' : ''}`}
              onClick={() => handleFilterChange('category', slug)}
              title={`Voir ${cat.name}`}
            >
              {cat.icon ? <span className="chip-icon" aria-hidden>{cat.icon}</span> : null}
              {cat.name}
            </button>
          );
        })}
      </div>

      <div className="products-content">
        {showFilters && (
          <motion.div 
            className="filters-sidebar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="filters-header">
              <h3>Filtres</h3>
              <button onClick={handleClearFilters}>Effacer tout</button>
            </div>
            
            <div className="filter-group">
              <label>Catégorie</label>
              <select 
                value={localFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => {
                  const slug = getCategorySlug(cat);
                  return (
                    <option key={cat._id || cat.id || slug} value={slug}>
                      {cat.name}
                    </option>
                  );
                })}
              </select>
            </div>
            
          <div className="filter-group">
            <label>Prix</label>
            <div className="price-range">
              <input
                type="number"
                placeholder="Min"
                value={localFilters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={localFilters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Évaluation minimale</label>
            <select 
              value={localFilters.minRating}
              onChange={(e) => handleFilterChange('minRating', e.target.value)}
            >
              <option value="">Toutes</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5</option>
            </select>
          </div>
            
            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localFilters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                />
                Produits vedettes
              </label>
            </div>
            
            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localFilters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                />
                En stock uniquement
              </label>
            </div>
          </motion.div>
        )}
        
        <div className={`products-grid ${viewMode} ${showFilters ? 'with-sidebar' : ''}`}>
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} viewMode={viewMode} />
            </motion.div>
          ))}
        </div>
        
        {products.length === 0 && !loading && (
          <div className="no-products">
            <h3>Aucun produit trouvé</h3>
            <p>Essayez de modifier vos critères de recherche</p>
            <button onClick={handleClearFilters}>
              Effacer les filtres
            </button>
          </div>
        )}
        
        {pagination.hasNextPage && (
          <div className="load-more">
            <button 
              onClick={handleLoadMore}
              disabled={loading}
              className="load-more-btn"
            >
              {loading ? 'Chargement...' : 'Charger plus'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;