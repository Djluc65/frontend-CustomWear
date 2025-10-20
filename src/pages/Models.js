import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { modelsAPI } from '../services/api';
import './Customize.css';
import './Models.css';

const Models = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    modelsAPI
      .getModels()
      .then((res) => {
        const data = res?.data?.data ?? res?.data ?? [];
        if (isMounted) setModels(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (isMounted) setError(err?.message || 'Erreur lors du chargement des modèles');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeModels = useMemo(() => models.filter((m) => m?.active !== false), [models]);

  if (loading) {
    return (
      <div className="models-page container py-4">
        <h1>Produits personnalisables</h1>
        <p>Chargement des modèles…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="models-page container py-4">
        <h1>Produits personnalisables</h1>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="models-page container py-4">
      <div className="models-header d-flex justify-content-between align-items-center mb-3">
        <h1 className="mb-0">Produits personnalisables</h1>
        <span className="models-count">{activeModels.length} modèle(s)</span>
      </div>
+      <nav className="models-subnav" aria-label="Sous-navigation">
+        <NavLink to="/customize" className={({ isActive }) => `subnav-link${isActive ? ' active' : ''}`}>Personnalisation</NavLink>
+        <NavLink to="/products" className={({ isActive }) => `subnav-link${isActive ? ' active' : ''}`}>Produit</NavLink>
+        <NavLink to="/models" end className={({ isActive }) => `subnav-link${isActive ? ' active' : ''}`}>Modèle</NavLink>
+        <NavLink to="/products" className={({ isActive }) => `subnav-link${isActive ? ' active' : ''}`}>Catégorie</NavLink>
+      </nav>
      {activeModels.length === 0 ? (
        <div className="alert alert-info">Aucun modèle actif pour le moment.</div>
      ) : (
        <div className="models-list" role="list">
          {activeModels.map((model) => (
            <Link
              key={model._id}
              to={`/customize?model=${model._id}`}
              className="model-card"
              role="listitem"
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
                {Array.isArray(model?.tags) && model.tags.length > 0 && (
                  <div className="model-card-tags">
                    {model.tags.map((t) => (
                      <span className="tag" key={t}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Models;