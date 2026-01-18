import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useSearchParams } from 'react-router-dom';
import { modelsAPI, assistantAPI } from '../services/api';
import './Customize.css';
import './Models.css';

import { compareSizes } from '../utils/sizes';

const Models = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const [initializedFromURL, setInitializedFromURL] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);
  const [modelColorSelection, setModelColorSelection] = useState({});
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [openSections, setOpenSections] = useState({
    categories: false,
    genres: false,
    colors: false,
    sizes: false,
  });
  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [assistantInput, setAssistantInput] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');

  const searchTerm = useMemo(() => String(searchParams.get('search') || '').trim().toLowerCase(), [searchParams]);
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    modelsAPI
      .getModels({ active: true })
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

  useEffect(() => {
    if (initializedFromURL) return;
    const categoryParam = String(searchParams.get('category') || '').toLowerCase();
    const genderParam = String(searchParams.get('gender') || '').toLowerCase();
    const colorParam = String(searchParams.get('color') || '');
    const sizeParam = String(searchParams.get('size') || '');
    if (categoryParam) setSelectedCategory(categoryParam);
    if (genderParam) setSelectedGender(genderParam);
    if (colorParam) setSelectedColors(colorParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
    if (sizeParam) setSelectedSizes(sizeParam.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
    setInitializedFromURL(true);
  }, [initializedFromURL, searchParams]);

  useEffect(() => {
    const params = {};
    const currentSearch = String(searchParams.get('search') || '').trim();
    if (currentSearch) params.search = currentSearch;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedGender !== 'all') params.gender = selectedGender;
    if (selectedColors.length > 0) params.color = selectedColors.join(',');
    if (selectedSizes.length > 0) params.size = selectedSizes.join(',');
    setSearchParams(params, { replace: true });
  }, [selectedCategory, selectedGender, selectedColors, selectedSizes, setSearchParams, searchParams]);

  const activeModels = useMemo(() => models.filter((m) => m?.active !== false), [models]);
  const categoryCounts = useMemo(() => {
    const map = new Map();
    activeModels.forEach((m) => {
      const cat = String(m?.category || '').toLowerCase();
      if (!cat) return;
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [activeModels]);
  const genderCounts = useMemo(() => {
    const map = new Map();
    activeModels.forEach((m) => {
      const g = String(m?.gender || '').toLowerCase();
      if (!g) return;
      map.set(g, (map.get(g) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [activeModels]);
  const colorCounts = useMemo(() => {
    const map = new Map();
    activeModels.forEach((m) => {
      const colors = Array.isArray(m?.colors) ? m.colors : [];
      colors.forEach((c) => {
        const key = String(c || '').toLowerCase();
        if (!key) return;
        map.set(key, (map.get(key) || 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [activeModels]);
  const sizeCounts = useMemo(() => {
    const map = new Map();
    activeModels.forEach((m) => {
      const sizes = Array.isArray(m?.sizes) ? m.sizes : [];
      sizes.forEach((s) => {
        const key = String(s || '').toLowerCase();
        if (!key) return;
        map.set(key, (map.get(key) || 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => compareSizes(a[0], b[0]));
  }, [activeModels]);
  const filteredModels = useMemo(() => {
    let list = activeModels;
    if (selectedCategory !== 'all') {
      list = list.filter(m => String(m?.category || '').toLowerCase() === selectedCategory);
    }
    if (selectedGender !== 'all') {
      list = list.filter(m => String(m?.gender || '').toLowerCase() === selectedGender);
    }
    if (selectedColors.length > 0) {
      list = list.filter(m => {
        const colors = Array.isArray(m?.colors) ? m.colors.map(c => String(c).toLowerCase()) : [];
        return selectedColors.some(c => colors.includes(c));
      });
    }
    if (selectedSizes.length > 0) {
      list = list.filter(m => {
        const sizes = Array.isArray(m?.sizes) ? m.sizes.map(s => String(s).toLowerCase()) : [];
        return selectedSizes.some(s => sizes.includes(s));
      });
    }
    if (searchTerm) {
      list = list.filter(m => {
        const name = String(m?.name || '').toLowerCase();
        const gender = String(m?.gender || '').toLowerCase();
        const category = String(m?.category || '').toLowerCase();
        const tags = Array.isArray(m?.tags) ? m.tags.map(t => String(t).toLowerCase()) : [];
        return (
          name.includes(searchTerm) ||
          gender.includes(searchTerm) ||
          category.includes(searchTerm) ||
          tags.some(t => t.includes(searchTerm))
        );
      });
    }
    return list;
  }, [activeModels, selectedCategory, selectedGender, selectedColors, selectedSizes, searchTerm]);
  const handleShowAllModels = () => {
    setSelectedCategory('all');
    setSelectedGender('all');
    setSelectedColors([]);
    setSelectedSizes([]);
    setSearchParams({}, { replace: true });
  };
  const toggleColorFilter = (color) => {
    const value = String(color || '').toLowerCase();
    setSelectedColors((prev) => (
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    ));
  };

  const toggleSizeFilter = (size) => {
    const value = String(size || '').toLowerCase();
    setSelectedSizes((prev) => (
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    ));
  };

  const getModelDisplayImage = (model) => {
    const selectedColor = modelColorSelection[model._id];
    if (selectedColor && model?.imagesByColor && model.imagesByColor[selectedColor]?.front) {
      return model.imagesByColor[selectedColor].front;
    }
    return model?.images?.front || model?.images?.back || '/logo512.png';
  };

  const handleAskAssistant = async (e) => {
    e.preventDefault();
    const message = assistantInput.trim();
    if (!message) return;
    setAssistantLoading(true);
    setAssistantError('');
    try {
      const firstModel = Array.isArray(filteredModels) && filteredModels.length > 0 ? filteredModels[0] : null;
      const summaryParts = [];
      if (firstModel?.name) summaryParts.push(`Nom: ${firstModel.name}`);
      if (firstModel?.category) summaryParts.push(`Catégorie: ${firstModel.category}`);
      if (firstModel?.gender) summaryParts.push(`Genre: ${firstModel.gender}`);
      if (firstModel?.colors && firstModel.colors.length > 0) {
        summaryParts.push(`Couleurs: ${firstModel.colors.slice(0, 3).join(', ')}`);
      }
      const productSummary = summaryParts.join(' | ');
      const res = await assistantAPI.ask({
        message,
        page: 'models',
        productSummary,
      });
      const reply = res?.data?.reply || '';
      setAssistantReply(reply);
    } catch (err) {
      setAssistantError(
        err?.response?.data?.message || 'Impossible de récupérer une recommandation pour le moment.'
      );
    } finally {
      setAssistantLoading(false);
    }
  };

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
        <span className="models-count">{filteredModels.length} modèles</span>
      </div>
      <nav className="models-subnav" aria-label="Sous-navigation">
        <NavLink to="/customize" className={({ isActive }) => `subnav-link${isActive ? ' active' : ''}`}>Personnalisation</NavLink>
        <button
          type="button"
          className="subnav-link"
          onClick={handleShowAllModels}
          aria-label="Afficher tous les modèles"
        >
          Modèle
        </button>
        
      </nav>
      <div className="assistant-compact">
        <form onSubmit={handleAskAssistant} className="assistant-compact-form">
          <input
            type="text"
            className="assistant-compact-input"
            placeholder="Besoin d’un conseil sur ces modèles ?"
            value={assistantInput}
            onChange={(e) => setAssistantInput(e.target.value)}
          />
          <button
            type="submit"
            className="assistant-compact-button"
            disabled={assistantLoading}
          >
            {assistantLoading ? 'Analyse...' : 'Conseil'}
          </button>
        </form>
        {assistantError && (
          <div className="assistant-compact-error">
            {assistantError}
          </div>
        )}
        {assistantReply && !assistantError && (
          <div className="assistant-compact-reply">
            <button 
              className="assistant-close-btn"
              onClick={() => setAssistantReply('')}
              title="Masquer le conseil"
            >
              ×
            </button>
            {assistantReply}
          </div>
        )}
      </div>
      {activeModels.length === 0 ? (
        <div className="alert alert-info">Aucun modèle actif pour le moment.</div>
      ) : (
        <div className="models-content">
          <aside className="filters-sidebar" aria-label="Filtres modèles">
            <div
              className={`filter-section${openSections.categories ? ' open' : ''}`}
              onClick={() => toggleSection('categories')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('categories'); }}
              aria-expanded={openSections.categories}
              aria-controls="filter-categories"
            >
              <h3>Catégories</h3>
              {openSections.categories && (
                <div id="filter-categories" className="filter-content">
                  <button
                    type="button"
                    className={`chip ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedCategory('all'); }}
                    aria-pressed={selectedCategory === 'all'}
                  >
                    Toutes
                  </button>
                  {categoryCounts.map(([cat, count]) => (
                    <button
                      key={cat}
                      type="button"
                      className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat); }}
                      aria-pressed={selectedCategory === cat}
                    >
                      {formatCategoryLabel(cat)} ({count})
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div
              className={`filter-section${openSections.genres ? ' open' : ''}`}
              onClick={() => toggleSection('genres')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('genres'); }}
              aria-expanded={openSections.genres}
              aria-controls="filter-genres"
              style={{ marginTop: '1rem' }}
            >
              <h3>Genres</h3>
              {openSections.genres && (
                <div id="filter-genres" className="filter-content">
                  <button
                    type="button"
                    className={`chip ${selectedGender === 'all' ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedGender('all'); }}
                    aria-pressed={selectedGender === 'all'}
                  >
                    Tous
                  </button>
                  {['homme','femme','enfant','unisexe'].map((g) => {
                    const count = genderCounts.find(([key]) => key === g)?.[1] || 0;
                    return (
                      <button
                        key={g}
                        type="button"
                        className={`chip ${selectedGender === g ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedGender(g); }}
                        aria-pressed={selectedGender === g}
                      >
                        {formatGenderLabel(g)} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div
              className={`filter-section${openSections.colors ? ' open' : ''}`}
              onClick={() => toggleSection('colors')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('colors'); }}
              aria-expanded={openSections.colors}
              aria-controls="filter-colors"
              style={{ marginTop: '1rem' }}
            >
              <h3>Couleurs</h3>
              {openSections.colors && (
                <div id="filter-colors" className="filter-content">
                  <button
                    type="button"
                    className={`chip ${selectedColors.length === 0 ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedColors([]); }}
                    aria-pressed={selectedColors.length === 0}
                  >
                    Toutes
                  </button>
                  {colorCounts.map(([color, count]) => (
                    <button
                      key={color}
                      type="button"
                      className={`chip ${selectedColors.includes(color) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleColorFilter(color); }}
                      aria-pressed={selectedColors.includes(color)}
                    >
                      {formatColorLabel(color)} ({count})
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div
              className={`filter-section${openSections.sizes ? ' open' : ''}`}
              onClick={() => toggleSection('sizes')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection('sizes'); }}
              aria-expanded={openSections.sizes}
              aria-controls="filter-sizes"
              style={{ marginTop: '1rem' }}
            >
              <h3>Tailles</h3>
              {openSections.sizes && (
                <div id="filter-sizes" className="filter-content">
                  <button
                    type="button"
                    className={`chip ${selectedSizes.length === 0 ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedSizes([]); }}
                    aria-pressed={selectedSizes.length === 0}
                  >
                    Toutes
                  </button>
                  {sizeCounts.map(([size, count]) => (
                    <button
                      key={size}
                      type="button"
                      className={`chip ${selectedSizes.includes(size) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleSizeFilter(size); }}
                      aria-pressed={selectedSizes.includes(size)}
                    >
                      {formatSizeLabel(size)} ({count})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
          <div className="models-list flex-grow-1" role="list">
            {filteredModels.map((model) => {
              const selectedColor = modelColorSelection[model._id];
              const customizeUrl = selectedColor
                ? `/customize?model=${model._id}&color=${encodeURIComponent(selectedColor)}`
                : `/customize?model=${model._id}`;
              return (
              <Link
                key={model._id}
                to={customizeUrl}
                className="model-card"
                role="listitem"
              >
                <div className="model-card-thumb">
                  <img
                    src={getModelDisplayImage(model)}
                    alt={model?.name || 'Modèle'}
                    loading="lazy"
                  />
                </div>
                <div className="model-card-meta">
                  <div className="model-card-title">{model?.name || 'Modèle'}</div>
                  {model?.description && (
                    <div className="model-card-description">
                      {model.description}
                    </div>
                  )}
                  <div className="model-card-price">
                    {Number.isFinite(Number(model?.basePrice)) ? `${Number(model.basePrice).toFixed(2)} €` : 'Prix indisponible'}
                  </div>
                  {Array.isArray(model?.colors) && model.colors.length > 0 && (
                    <div className="model-card-colors">
                      {model.colors.map((color) => {
                        const isSelected = modelColorSelection[model._id] === color;
                        return (
                          <button
                            key={color}
                            type="button"
                            className={`model-color-dot${isSelected ? ' selected' : ''}`}
                            style={{ backgroundColor: getColorSwatchColor(color) }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setModelColorSelection((prev) => ({
                                ...prev,
                                [model._id]: color,
                              }));
                            }}
                            aria-label={formatColorLabel(color)}
                          />
                        );
                      })}
                    </div>
                  )}
                  {Array.isArray(model?.tags) && model.tags.length > 0 && (
                    <div className="model-card-tags">
                      {model.tags.map((t) => (
                        <span className="tag" key={t}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            )})}
          </div>
        </div>
      )}
    </div>
  );
};

export default Models;

const formatCategoryLabel = (slug) => {
  if (!slug) return '';
  const s = String(slug).toLowerCase();
  const map = {
    't-shirts': 'T-shirts',
    'vestes': 'Vestes',
    'casquettes': 'Casquettes',
    'bonnets': 'Bonnets',
    'vaisselle': 'Vaisselle',
    'mugs': 'Mugs',
    'mug': 'Mug'
  };
  return map[s] || s.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
};

const formatGenderLabel = (slug) => {
  const s = String(slug || '').toLowerCase();
  const map = {
    homme: 'Homme',
    femme: 'Femme',
    enfant: 'Enfants',
    unisexe: 'Unisexe',
  };
  return map[s] || s;
};
const formatColorLabel = (slug) => {
  const s = String(slug || '').toLowerCase();
  const map = {
    noir: 'Noir',
    blanc: 'Blanc',
    bleu: 'Bleu',
    vert: 'Vert',
    jaune: 'Jaune',
    rouge: 'Rouge',
    mauve: 'Mauve',
    rose: 'Rose',
    marron: 'Marron',
    gris: 'Gris',
    'vert foncé palme': 'Vert foncé palme',
    'bleu foncé palme': 'Bleu foncé palme',
  };
  return map[s] || s.replace(/^./, c => c.toUpperCase());
};
const formatSizeLabel = (slug) => {
  return String(slug || '').toUpperCase();
};

const getColorSwatchColor = (color) => {
  const lower = String(color || '').toLowerCase();
  if (lower === 'noir') return '#000000';
  if (lower === 'blanc') return '#ffffff';
  if (lower === 'vert') return '#166534';
  if (lower === 'bleu') return '#1e3a8a';
  if (lower === 'gris') return '#6b7280';
  if (lower === 'rouge') return '#fe0606ff';
  if (lower === 'rose') return '#ffd7cbff';
  if (lower === 'jaune') return '#ffe600ff';
  if (lower === 'marron') return '#523a32ff';
  if (lower === 'mauve') return '#606ff3ff';
  if (lower === 'vert palme') return '#bfffb5ff';
  if (lower === 'bleu palme') return '#91c6ffff';
  return lower;
};
