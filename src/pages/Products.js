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

// Palette de couleurs fixe pour le filtre Couleur
const COLOR_PALETTE = {
  Noir: '#000000',
  Blanc: '#ffffff',
  Bleu: '#1e3a8a',
  Vert: '#16a34a',
  Jaune: '#f59e0b',
  Rouge: '#dc2626',
  Mauve: '#7c3aed',
  Rose: '#ec4899',
  Marron: '#92400e'
};

const Products = () => {
  const dispatch = useDispatch();
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { 
    products, 
    isLoading, 
    error, 
    filters, 
    pagination,
    categories 
  } = useSelector(state => state.products);

  // Liste fixe des tailles disponibles
  const FIXED_SIZES = ['XS','S','M','L','XL','2XL','3XL','4XL','5XL'];

  // Options de couleur et taille dérivées de la palette et des produits
  const productColors = Array.from(new Set(
    (Array.isArray(products) ? products.flatMap(p => {
      const colorsFromProduct = Array.isArray(p.colors) ? p.colors.map(c => String(c)) : [];
      const colorsFromVariants = Array.isArray(p.variants) ? p.variants.map(v => {
        const val = typeof v.color === 'string' ? v.color : (v.color?.name || '');
        return String(val);
      }) : [];
      return [...colorsFromProduct, ...colorsFromVariants];
    }) : [])
  )).filter(Boolean);

  const colorOptions = Array.from(new Set([
    ...Object.keys(COLOR_PALETTE),
    ...productColors.map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())
  ])).sort();

  const dynamicSizes = Array.from(new Set(
    (Array.isArray(products) ? products.flatMap(p => {
      const sizesFromProduct = Array.isArray(p.sizes) ? p.sizes.map(s => String(s)) : [];
      const sizesFromVariants = Array.isArray(p.variants) ? p.variants.map(v => String(v.size || '')) : [];
      return [...sizesFromProduct, ...sizesFromVariants];
    }) : [])
  )).filter(Boolean);

  const sizeOptions = Array.from(new Set([
    ...FIXED_SIZES,
    ...dynamicSizes.map(s => String(s).toUpperCase())
  ]));

  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get('search') || '',
    category: category || searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    featured: searchParams.get('featured') === 'true',
    inStock: searchParams.get('inStock') === 'true',
    gender: searchParams.get('gender') || '',
    color: searchParams.get('color') || '',
    size: searchParams.get('size') || ''
  });

  // Sur desktop, ouvrir les filtres par défaut; sur mobile/tablette, les laisser fermés
  useEffect(() => {
    const isDesktop = window?.innerWidth >= 1024;
    setShowFilters(isDesktop);
  }, []);

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
      gender: localFilters.gender || '',
      color: localFilters.color || '',
      size: localFilters.size || '',
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
      inStock: false,
      gender: '',
      color: '',
      size: ''
    });
    dispatch(clearFilters());
  };

  const handleLoadMore = () => {
    const currentPage = pagination?.page || pagination?.currentPage || 1;
    const totalPages = pagination?.pages || pagination?.totalPages || 1;
    if (currentPage < totalPages) {
      dispatch(fetchProducts({
        category: localFilters.category || '',
        search: localFilters.search || '',
        minPrice: localFilters.minPrice || '',
        maxPrice: localFilters.maxPrice || '',
        featured: localFilters.featured || false,
        inStock: localFilters.inStock || false,
        minRating: localFilters.minRating || '',
        gender: localFilters.gender || '',
        color: localFilters.color || '',
        size: localFilters.size || '',
        page: currentPage + 1,
        limit: 12
      }));
    }
  };

  if (isLoading && products.length === 0) {
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
            onClick={() => setShowFilters(prev => !prev)}
            aria-expanded={showFilters}
            title={showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
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
              <label>Genre</label>
              <select 
                value={localFilters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="">Tous</option>
                <option value="unisexe">Unisexe</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
                <option value="enfant">Enfant</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Couleur</label>
              <select 
                value={localFilters.color}
                onChange={(e) => handleFilterChange('color', e.target.value)}
              >
                <option value="">Toutes</option>
                {colorOptions.map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Taille</label>
              <select 
                value={localFilters.size}
                onChange={(e) => handleFilterChange('size', e.target.value)}
              >
                <option value="">Toutes</option>
                {sizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
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
          {products
            .filter((p) => {
              // Catégorie
              const productCategorySlug = (() => {
                const catObj = (typeof p.category === 'object') ? p.category : { name: p.category };
                return getCategorySlug(catObj);
              })();
              const categoryOk = localFilters.category
                ? productCategorySlug === String(localFilters.category)
                : true;
              
              // Genre
              const genderOk = localFilters.gender
                ? String(p.gender || '').toLowerCase() === String(localFilters.gender).toLowerCase()
                : true;
              
              // Couleur
              const colorOk = localFilters.color
                ? (
                    (Array.isArray(p.colors) && p.colors.some(c => String(c).toLowerCase() === String(localFilters.color).toLowerCase()))
                  ) || (
                    Array.isArray(p.variants) && p.variants.some(v => {
                      const vColor = typeof v.color === 'string' ? v.color : (v.color?.name || '');
                      return String(vColor).toLowerCase() === String(localFilters.color).toLowerCase();
                    })
                  )
                : true;
              
              // Taille
              const sizeOk = localFilters.size
                ? (
                    (Array.isArray(p.sizes) && p.sizes.some(s => String(s).toUpperCase() === String(localFilters.size).toUpperCase()))
                  ) || (
                    Array.isArray(p.variants) && p.variants.some(v => String(v.size || '').toUpperCase() === String(localFilters.size).toUpperCase())
                  )
                : true;
              
              // Prix (utiliser le prix minimum des variantes sinon prix produit)
              const computedPrice = (() => {
                if (Array.isArray(p.variants) && p.variants.length > 0) {
                  const prices = p.variants
                    .map(v => Number(v?.price))
                    .filter(n => Number.isFinite(n));
                  if (prices.length > 0) return Math.min(...prices);
                }
                const base = Number(p?.price?.base);
                const sale = Number(p?.price?.sale);
                if (Number.isFinite(sale)) return sale;
                if (Number.isFinite(base)) return base;
                return NaN;
              })();
              const priceOk = (() => {
                const hasMin = localFilters.minPrice !== '';
                const hasMax = localFilters.maxPrice !== '';
                if (!hasMin && !hasMax) return true;
                if (!Number.isFinite(computedPrice)) return false;
                const min = Number(localFilters.minPrice);
                const max = Number(localFilters.maxPrice);
                if (hasMin && computedPrice < min) return false;
                if (hasMax && computedPrice > max) return false;
                return true;
              })();
              
              // Évaluation minimale
              const avgRating = (() => {
                if (Array.isArray(p.reviews) && p.reviews.length > 0) {
                  const sum = p.reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
                  return sum / p.reviews.length;
                }
                return Number(p.rating) || 0;
              })();
              const ratingOk = localFilters.minRating
                ? avgRating >= Number(localFilters.minRating)
                : true;
              
              // Vedette
              const featuredOk = localFilters.featured ? Boolean(p.featured) : true;
              
              // Stock
              const stockCount = (() => {
                if (Number.isFinite(Number(p.totalStock))) return Number(p.totalStock);
                if (Array.isArray(p.variants)) return p.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
                return Number(p.stock) || 0;
              })();
              const inStockOk = localFilters.inStock ? (stockCount > 0) : true;
              
              return categoryOk && genderOk && colorOk && sizeOk && priceOk && ratingOk && featuredOk && inStockOk;
            })
            .map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} viewMode={viewMode} activeColor={localFilters.color || ''} />
              </motion.div>
            ))}
        </div>
        
        {products.length === 0 && !isLoading && (
          <div className="no-products">
            <h3>Aucun produit trouvé</h3>
            <p>Essayez de modifier vos critères de recherche</p>
            <button onClick={handleClearFilters}>
              Effacer les filtres
            </button>
          </div>
        )}
        
        {((pagination?.page || pagination?.currentPage || 1) < (pagination?.pages || pagination?.totalPages || 1)) && (
          <div className="load-more">
            <button 
              onClick={handleLoadMore}
              disabled={isLoading}
              className="load-more-btn"
            >
              {isLoading ? 'Chargement...' : 'Charger plus'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;