import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { modelsAPI, productsAPI } from '../services/api';
import './Customize.css';
const COLOR_NAME_TO_HEX = {
  'Noir': '#000000',
  'Blanc': '#ffffff',
  'Bleu': '#1e3a8a',
  'Vert': '#16a34a',
  'Jaune': '#f59e0b',
  'Rouge': '#dc2626',
  'Mauve': '#7c3aed',
  'Rose': '#ec4899',
  'Marron': '#92400e',
};
const getColorHex = (name) => {
  if (!name) return '#ffffff';
  const key = String(name).trim();
  return COLOR_NAME_TO_HEX[key] || name;
};

// Utilitaire pour lire les query params
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const DEFAULT_MODEL_PLACEHOLDER = {
  name: 'Produit personnalisable',
  type: 't-shirt',
  gender: 'unisexe',
  category: 't-shirts',
  basePrice: 19.99,
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['Blanc', 'Noir', 'Bleu'],
  images: {
    front: 'https://res.cloudinary.com/demo/image/upload/w_800,h_800,c_fit/sample.jpg',
    back: 'https://res.cloudinary.com/demo/image/upload/w_800,h_800,c_fit/sample.jpg'
  },
};



const Customize = () => {
  const query = useQuery();
  const productId = query.get('product');
  const variantId = query.get('variant');

  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_PLACEHOLDER);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_MODEL_PLACEHOLDER.colors[0]);
  // removed selectedSize state
  const [showBack, setShowBack] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState('');

  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState(null);

  // Image importée par le client
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [imageXPercent, setImageXPercent] = useState(50);
  const [imageYPercent, setImageYPercent] = useState(50);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const canvasRef = useRef(null);

  // Charger modèles pour permettre le choix de type/genre/catégorie
  useEffect(() => {
    let mounted = true;
    modelsAPI.getModels()
      .then(res => {
        const data = res?.data?.data || res?.data || [];
        if (!mounted) return;
        setModels(Array.isArray(data) ? data : []);
        const firstActive = (Array.isArray(data) ? data : []).find(m => m?.active);
        if (firstActive) {
          setSelectedModel(firstActive);
          setSelectedColor(Array.isArray(firstActive.colors) && firstActive.colors.length ? firstActive.colors[0] : DEFAULT_MODEL_PLACEHOLDER.colors[0]);
        }
      })
      .catch(err => {
        console.error('[Customize] getModels error', err?.response?.data || err);
      });
    return () => { mounted = false; };
  }, []);

  // Charger le produit pour afficher prix/matière/stock/description
  useEffect(() => {
    if (!productId) return;
    let mounted = true;
    setProductLoading(true);
    setProductError(null);
    productsAPI.getProduct(productId)
      .then(res => {
        const data = res?.data?.data || res?.data;
        if (!mounted) return;
        setProduct(data);
      })
      .catch(err => {
        setProductError(err?.response?.data?.message || 'Erreur de chargement du produit');
      })
      .finally(() => {
        if (mounted) setProductLoading(false);
      });
    return () => { mounted = false; };
  }, [productId]);

  // Trouver la variante sélectionnée si variantId fourni
  // removed selectedVariant memo

  // Définir des infos dérivées du produit
  // removed currentPrice memo

  const currentMaterial = useMemo(() => {
    return product?.specifications?.material || product?.material || '';
  }, [product]);

  // removed currentStock memo

  // Couleurs disponibles pour le modèle sélectionné
  const availableColors = useMemo(() => {
    return Array.isArray(selectedModel?.colors) && selectedModel.colors.length > 0
      ? selectedModel.colors
      : DEFAULT_MODEL_PLACEHOLDER.colors;
  }, [selectedModel]);

  // removed availableSizes memo

  const activeModels = useMemo(() => {
    return models.filter(m => m?.active !== false);
  }, [models]);

  // removed uniqueTypes/uniqueGenders/uniqueCategories memos

  const handleModelChange = (modelId) => {
    const next = activeModels.find(m => String(m._id) === String(modelId)) || selectedModel;
    setSelectedModel(next);
    if (next) {
      setSelectedColor(Array.isArray(next.colors) && next.colors.length ? next.colors[0] : selectedColor);
    }
  };

  // removed handleTypeChange/handleGenderChange/handleCategoryChange

  // Déplacement et alignement à droite de l'image importée
  const nudgeImageRight = () => {
    setImageXPercent(prev => Math.min(prev + 5, 98));
  };

  const alignImageRight = () => {
    setImageXPercent(92);
  };

  // Révoquer l'URL blob au changement et au démontage
  useEffect(() => {
    return () => {
      if (uploadedImageUrl && uploadedImageUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(uploadedImageUrl); } catch (e) {}
      }
    };
  }, [uploadedImageUrl]);

  // Précharger les images avant/arrière du modèle pour éviter scintillements
  useEffect(() => {
    const front = selectedModel?.images?.front || DEFAULT_MODEL_PLACEHOLDER.images.front;
    const back = selectedModel?.images?.back || DEFAULT_MODEL_PLACEHOLDER.images.back;
    [front, back].forEach(src => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    });
  }, [selectedModel]);

  // Préselection via paramètre 'model' dans l'URL (si fourni)
  useEffect(() => {
    const modelId = query.get('model');
    if (!modelId || activeModels.length === 0) return;
    const next = activeModels.find(m => String(m._id) === String(modelId));
    if (next && next._id !== selectedModel?._id) {
      setSelectedModel(next);
      if (Array.isArray(next.colors) && next.colors.length) {
        setSelectedColor(next.colors[0]);
      }
    }
  }, [query, activeModels]);

  // Synchroniser état avec l'URL (color, size, section)
  // removed color/size URL sync

  useEffect(() => {
    const section = query.get('section');
    if (section) {
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [query]);

  // Centraliser la sélection de modèle
  // removed selectModelBy

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadedImageUrl && uploadedImageUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(uploadedImageUrl); } catch (err) {}
    }
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
  };

  return (
    <div className="customize-page">
      <div className="customize-header">
        <div className="customize-title">
          <h1>Personnalisation du produit</h1>
          <p>Sélectionnez le modèle, la couleur et ajoutez vos visuels.</p>
        </div>
      </div>

      <div className="customize-content">
        {/* Panneau gauche: choix modèle et infos */}
        <div className="customize-tools">
          <div className="panel">
            <h3>Produit</h3>
            <div className="form-group">
              <label>Modèle</label>
              <select value={selectedModel?._id || ''} onChange={(e) => handleModelChange(e.target.value)}>
                {activeModels.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="panel">
            <h3>Détails du produit</h3>
            {productLoading && <p>Chargement du produit...</p>}
            {productError && <p style={{ color: '#dc2626' }}>{productError}</p>}
            <div>
              {/* Prix supprimé */}
              {product?.description && (
                <p><strong>Description:</strong> {product.description}</p>
              )}
              {currentMaterial && (
                <p><strong>Matière:</strong> {currentMaterial}</p>
              )}
              {/* Stock supprimé */}
            </div>
          </div>

          <div className="panel">
            <h3>Image</h3>
            <div className="form-group">
              <label>Uploader une image (PNG/JPG/SVG)</label>
              <input type="file" accept="image/*,.svg" onChange={handleFileUpload} />
            </div>
            <div className="quick-actions">
              <button className="chip" onClick={nudgeImageRight}>Déplacer à droite</button>
              <button className="chip" onClick={alignImageRight}>Aligner à droite</button>
            </div>
            <div className="form-group">
              <label>Taille</label>
              <input type="range" min="0.2" max="3" step="0.05" value={imageScale} onChange={(e) => setImageScale(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Rotation</label>
              <input type="range" min="-180" max="180" step="1" value={imageRotation} onChange={(e) => setImageRotation(Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Zone d'aperçu */}
        <div className="customize-preview">
          <div className="preview-toolbar">
            <div className="options-row">
              <button className={`chip ${!showBack ? 'active' : ''}`} onClick={() => setShowBack(false)}>Avant</button>
              <button className={`chip ${showBack ? 'active' : ''}`} onClick={() => setShowBack(true)}>Arrière</button>
            </div>
          </div>

          <PreviewCanvas
            showBack={showBack}
            selectedModel={selectedModel}
            uploadedImageUrl={uploadedImageUrl}
            imageXPercent={imageXPercent}
            imageYPercent={imageYPercent}
            imageScale={imageScale}
            imageRotation={imageRotation}
            canvasRef={canvasRef}
          />
        </div>

        {/* Panneau droit: actions rapides (placeholder pour imprimerie, etc.) */}
        <div className="preview-sidebar-right">
          <div className="panel">
            <h3>Techniques d'impression</h3>
            <div className="options-row">
              <button className={`chip ${selectedTechnique === 'DTF' ? 'active' : ''}`} onClick={() => setSelectedTechnique('DTF')}>DTF</button>
              <button className={`chip ${selectedTechnique === 'Numérique' ? 'active' : ''}`} onClick={() => setSelectedTechnique('Numérique')}>Numérique</button>
              <button className={`chip ${selectedTechnique === 'DTG' ? 'active' : ''}`} onClick={() => setSelectedTechnique('DTG')}>DTG</button>
              <button className={`chip ${selectedTechnique === 'Sublimation' ? 'active' : ''}`} onClick={() => setSelectedTechnique('Sublimation')}>Sublimation</button>
            </div>
            <p style={{ color: '#6b7280' }}>Aperçu et coûts seront ajoutés ici.</p>
          </div>

          <div className="panel">
            <h3>Sauvegarde</h3>
            <p style={{ color: '#6b7280' }}>Connexion requise pour enregistrer le design.</p>
            <button className="chip">Enregistrer la création</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customize;

// Composant d'aperçu isolé et mémoïsé (défini avant usage)
const PreviewCanvas = React.memo(({ showBack, selectedModel, uploadedImageUrl, imageXPercent, imageYPercent, imageScale, imageRotation, canvasRef }) => {
  const baseSrc = showBack ? (selectedModel?.images?.back || DEFAULT_MODEL_PLACEHOLDER.images.back)
                           : (selectedModel?.images?.front || DEFAULT_MODEL_PLACEHOLDER.images.front);
  return (
    <div className="canvas-container" ref={canvasRef}>
      <img className="product-base" src={baseSrc} alt="Base produit" />
      {/* color overlay removed */}
      {uploadedImageUrl && (
        <img
          src={uploadedImageUrl}
          alt="Upload"
          className="uploaded-image"
          style={{
            left: `${imageXPercent}%`,
            top: `${imageYPercent}%`,
            transform: `translate(-50%, -50%) scale(${imageScale}) rotate(${imageRotation}deg)`,
            width: '50%',
          }}
        />
      )}
    </div>
  );
});