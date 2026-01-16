import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/slices/productsSlice';
import { modelsAPI } from '../services/api';
import ProductCard from '../components/Products/ProductCard';
import './Models.css';
import './Products.css';
import './Search.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('search') || '';
  const dispatch = useDispatch();

  const { products, isLoading: productsLoading } = useSelector(state => state.products);
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    if (query) {
      // Fetch Products
      dispatch(fetchProducts({ search: query }));

      // Fetch Models
      setModelsLoading(true);
      modelsAPI.getModels({ active: true })
        .then(res => {
           const allModels = res?.data?.data ?? res?.data ?? [];
           // Client-side filtering for models
           const lowerQuery = query.toLowerCase();
           const filtered = allModels.filter(m => {
             const name = (m.name || '').toLowerCase();
             const category = (m.category || '').toLowerCase();
             const tags = (m.tags || []).map(t => t.toLowerCase());
             return name.includes(lowerQuery) || category.includes(lowerQuery) || tags.some(t => t.includes(lowerQuery));
           });
           setModels(filtered);
        })
        .catch(err => console.error("Error fetching models:", err))
        .finally(() => setModelsLoading(false));
    }
  }, [query, dispatch]);

  if (!query) {
    return (
      <div className="search-page container py-5 text-center">
        <h2>Veuillez entrer un terme de recherche</h2>
        <p>Utilisez la barre de recherche ci-dessus pour trouver des produits ou des modèles.</p>
      </div>
    );
  }

  return (
    <div className="search-page container py-4">
      <h1 className="mb-4">Résultats de recherche pour "{query}"</h1>

      <section className="search-section mt-4">
        <h2>Produits trouvés ({products.length})</h2>
        {productsLoading ? (
          <div className="loading-spinner"></div>
        ) : (
          products.length > 0 ? (
            <div className="products-grid">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-muted">Aucun produit ne correspond à votre recherche.</p>
          )
        )}
      </section>

      <section className="search-section mt-5">
        <h2>Modèles trouvés ({models.length})</h2>
        {modelsLoading ? (
          <div className="loading-spinner"></div>
        ) : (
          models.length > 0 ? (
            <div className="models-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {models.map(model => (
                <Link
                  key={model._id}
                  to={`/customize?model=${model._id}`}
                  className="model-card"
                  style={{ width: '100%', maxWidth: 'none' }}
                >
                  <div className="model-card-thumb">
                    <img
                      src={model?.images?.front || model?.images?.back || '/logo512.png'}
                      alt={model?.name || 'Modèle'}
                      loading="lazy"
                    />
                  </div>
                  <div className="model-card-meta">
                    <div className="model-card-title">{model?.name || 'Modèle'}</div>
                    <div className="model-card-price">
                      {Number.isFinite(Number(model?.basePrice)) ? `${Number(model.basePrice).toFixed(2)} €` : 'Prix indisponible'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted">Aucun modèle ne correspond à votre recherche.</p>
          )
        )}
      </section>
    </div>
  );
};

export default Search;
