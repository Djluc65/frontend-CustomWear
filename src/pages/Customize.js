import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { modelsAPI, productsAPI } from '../services/api';
import { sortSizes } from '../utils/sizes';
import './Customize.css';

import CustomizationPricing from '../components/Customization/CustomizationPricing';
import CustomizationSelector from '../components/Customization/CustomizationSelector';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiCreditCard } from 'react-icons/fi';
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
  const [selectedSize, setSelectedSize] = useState(DEFAULT_MODEL_PLACEHOLDER.sizes[0]);
  const [showBack, setShowBack] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState('');

  const [product, setProduct] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [computedTotals, setComputedTotals] = useState({ customizationPrice: 0, baseModelPrice: Number(DEFAULT_MODEL_PLACEHOLDER.basePrice), grandTotal: Number(DEFAULT_MODEL_PLACEHOLDER.basePrice) });

  const handleAddToCartCustomized = () => {
    try {
      const totalPrice = Number(computedTotals?.grandTotal ?? (Number(selectedModel?.basePrice) || Number(DEFAULT_MODEL_PLACEHOLDER.basePrice)));
      const currentSideImage = (
        (selectedModel?.imagesByColor?.[selectedColor]?.[showBack ? 'back' : 'front']) ||
        (selectedModel?.images?.[showBack ? 'back' : 'front']) ||
        null
      );
      const payload = {
        productId: selectedModel?._id,
        quantity: 1,
        price: totalPrice,
        image: currentSideImage,
        color: selectedColor,
        size: selectedSize,
        customization: {
          selection: {
            text: {
              front: Array.isArray(textLayers) && textLayers.some(t => t?.side === 'front' && (t?.visible ?? true)),
              back: Array.isArray(textLayers) && textLayers.some(t => t?.side === 'back' && (t?.visible ?? true)),
            },
            image: {
              front: Boolean(uploadedImageUrl && imageVisible && imageSide === 'front'),
              back: Boolean(uploadedImageUrl && imageVisible && imageSide === 'back'),
            },
          },
          textLayers,
          image: {
            url: uploadedImageUrl || null,
            side: imageSide || (showBack ? 'back' : 'front'),
            visible: Boolean(imageVisible),
          },
          totals: computedTotals,
          technique: selectedTechnique,
        },
        product: {
          _id: selectedModel?._id,
          name: selectedModel?.name,
          price: { base: Number(selectedModel?.basePrice) || Number(DEFAULT_MODEL_PLACEHOLDER.basePrice) },
          images: selectedModel?.images,
          category: selectedModel?.category,
        }
      };
      if (!payload.productId) {
        toast.error("Impossible d’ajouter au panier: modèle introuvable");
        return;
      }
      dispatch(addToCart(payload));
      toast.success('Personnalisation ajoutée au panier !');
    } catch (err) {
      console.error('[Customize] handleAddToCartCustomized error', err);
      toast.error('Une erreur est survenue lors de l’ajout au panier');
    }
  };

  const handleCheckoutCustomized = () => {
    handleAddToCartCustomized();
    navigate('/checkout');
  };
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState(null);

  // Image importée par le client
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [panelOpen, setPanelOpen] = useState({
    produit: false,
    image: false,
    texte: false,
    galerie: false,
    techniques: false,
    save: false,
  });
  const togglePanel = (key) => setPanelOpen(prev => ({ ...prev, [key]: !prev[key] }));
  const [imageXPercent, setImageXPercent] = useState(50);
  const [imageYPercent, setImageYPercent] = useState(50);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  // Nouveaux états pour les améliorations d'image
  const [imageVisible, setImageVisible] = useState(true);
  const [imageLocked, setImageLocked] = useState(false);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [imageFlipX, setImageFlipX] = useState(false);
  const [imageZIndex, setImageZIndex] = useState(2);
  const [imageSide, setImageSide] = useState('front');
  const canvasRef = useRef(null);

  // Texte: calques et édition
  const [textLayers, setTextLayers] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [textCharLimit, setTextCharLimit] = useState(50);

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [historyActions, setHistoryActions] = useState([]);

  const [previewMode, setPreviewMode] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1);

  const pushHistory = (label) => {
    setHistory(prev => [...prev, JSON.stringify(textLayers)]);
    setHistoryActions(prev => [...prev, label]);
    setFuture([]);
  };

  const undo = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setFuture(f => [JSON.stringify(textLayers), ...f]);
      setTextLayers(JSON.parse(last));
      return prev.slice(0, prev.length - 1);
    });
    setEditingTextId(null);
  };

  const redo = () => {
    setFuture(prev => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      setHistory(h => [...h, JSON.stringify(textLayers)]);
      setTextLayers(JSON.parse(next));
      return prev.slice(1);
    });
    setEditingTextId(null);
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [textLayers]);

  const createTextLayer = (overrides = {}) => ({
    id: `text-${Date.now()}`,
    content: 'Votre texte',
    xPercent: 50,
    yPercent: 50,
    rotation: 0,
    scale: 1,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 32,
    fontWeight: 400,
    fontStyle: 'normal',
    textDecoration: 'none',
    letterSpacing: 0,
    lineHeight: 1.2,
    textTransform: 'none',
    color: '#111827',
    backgroundEnabled: false,
    backgroundColor: '#ffffff',
    padding: 4,
    borderEnabled: false,
    borderColor: '#000000',
    borderWidth: 0,
    borderStyle: 'solid',
    shadowEnabled: false,
    shadowX: 0,
    shadowY: 0,
    shadowBlur: 0,
    shadowColor: 'rgba(0,0,0,0.3)',
    opacity: 1,
    locked: false,
    visible: true,
    name: 'Texte',
    zIndex: 1,
    side: 'front',
    ...overrides,
  });

  const addTextLayer = () => {
    const nextIndex = textLayers.length + 1;
    const next = createTextLayer({ name: `Texte ${nextIndex}` , side: showBack ? 'back' : 'front', visible: true, zIndex: nextIndex });
    setTextLayers(prev => [...prev, next]);
    setSelectedTextId(next.id);
    setEditingTextId(next.id);
    pushHistory('Ajouter texte');
  };

  const updateTextLayer = (id, patch, label = 'Modifier texte') => {
    pushHistory(label);
    setTextLayers(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const deleteTextLayer = (id) => {
    pushHistory('Supprimer texte');
    setTextLayers(prev => prev.filter(t => t.id !== id).map((t, i) => ({ ...t, zIndex: i + 1 })));
    if (selectedTextId === id) setSelectedTextId(null);
    if (editingTextId === id) setEditingTextId(null);
  };

  const duplicateTextLayer = (id) => {
    const base = textLayers.find(t => t.id === id);
    if (!base) return;
    const clone = createTextLayer({ ...base, id: `text-${Date.now()}-copy`, name: `${base.name || 'Texte'} (copie)`, xPercent: Math.min(base.xPercent + 3, 95), yPercent: Math.min(base.yPercent + 3, 95), zIndex: textLayers.length + 1 });
    pushHistory('Dupliquer texte');
    setTextLayers(prev => [...prev, clone]);
    setSelectedTextId(clone.id);
  };

  const toggleLockTextLayer = (id) => {
    const target = textLayers.find(t => t.id === id);
    if (!target) return;
    updateTextLayer(id, { locked: !target.locked }, target.locked ? 'Déverrouiller texte' : 'Verrouiller texte');
  };

  const renameTextLayer = (id, name) => {
    updateTextLayer(id, { name }, 'Renommer texte');
  };

  const toggleVisibilityTextLayer = (id) => {
    const target = textLayers.find(t => t.id === id);
    if (!target) return;
    updateTextLayer(id, { visible: !(target.visible ?? true) }, (target.visible ?? true) ? 'Masquer texte' : 'Afficher texte');
  };

  const moveTextLayerUp = (id) => {
    setTextLayers(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx+1]] = [next[idx+1], next[idx]];
      return next.map((t, i) => ({ ...t, zIndex: i + 1 }));
    });
    pushHistory("Monter d'un niveau");
  };

  const moveTextLayerDown = (id) => {
    setTextLayers(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx], next[idx-1]] = [next[idx-1], next[idx]];
      return next.map((t, i) => ({ ...t, zIndex: i + 1 }));
    });
    pushHistory('Descendre d\'un niveau');
  };

  const bringTextLayerToFront = (id) => {
    setTextLayers(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx < 0) return prev;
      const item = prev[idx];
      const next = [...prev.slice(0, idx), ...prev.slice(idx+1), item];
      return next.map((t, i) => ({ ...t, zIndex: i + 1 }));
    });
    pushHistory('Placer au premier plan');
  };

  const sendTextLayerToBack = (id) => {
    setTextLayers(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx < 0) return prev;
      const item = prev[idx];
      const next = [item, ...prev.slice(0, idx), ...prev.slice(idx+1)];
      return next.map((t, i) => ({ ...t, zIndex: i + 1 }));
    });
    pushHistory('Placer à l\'arrière-plan');
  };

  const alignTextHorizontal = (id, pos) => {
    const values = { left: 8, center: 50, right: 92 };
    updateTextLayer(id, { xPercent: values[pos] ?? 50 }, 'Aligner horizontal');
  };
  const alignTextVertical = (id, pos) => {
    const values = { top: 8, middle: 50, bottom: 92 };
    updateTextLayer(id, { yPercent: values[pos] ?? 50 }, 'Aligner vertical');
  };

  const rotateTextTo = (id, angle) => {
    updateTextLayer(id, { rotation: angle }, 'Rotation prédéfinie');
  };

  // Sauvegarde/partage et export
  const serializeCustomization = () => ({
    selectedColor,
    showBack,
    textLayers,
    uploadedImageUrl,
    imageXPercent,
    imageYPercent,
    imageScale,
    imageRotation,
    imageVisible,
    imageLocked,
    imageOpacity,
    imageFlipX,
    imageZIndex,
    imageSide,
  });

  const saveCustomizationLocal = () => {
    try {
      localStorage.setItem('cw_customization', JSON.stringify(serializeCustomization()));
      toast.success('Création sauvegardée.');
    } catch(e) { console.error('Save error', e); toast.error('Erreur lors de la sauvegarde.'); }
  };
  const loadCustomizationLocal = () => {
    try {
      const raw = localStorage.getItem('cw_customization');
      if (!raw) { toast.info('Aucune sauvegarde trouvée.'); return; }
      const data = JSON.parse(raw);
      setTextLayers(data.textLayers || []);
      if (typeof data.showBack === 'boolean') setShowBack(data.showBack);
      if (data.selectedColor) setSelectedColor(data.selectedColor);
      if (typeof data.uploadedImageUrl === 'string') setUploadedImageUrl(data.uploadedImageUrl);
      if (typeof data.imageXPercent === 'number') setImageXPercent(data.imageXPercent);
      if (typeof data.imageYPercent === 'number') setImageYPercent(data.imageYPercent);
      if (typeof data.imageScale === 'number') setImageScale(data.imageScale);
      if (typeof data.imageRotation === 'number') setImageRotation(data.imageRotation);
      if (typeof data.imageVisible === 'boolean') setImageVisible(data.imageVisible);
      if (typeof data.imageLocked === 'boolean') setImageLocked(data.imageLocked);
      if (typeof data.imageOpacity === 'number') setImageOpacity(data.imageOpacity);
      if (typeof data.imageFlipX === 'boolean') setImageFlipX(data.imageFlipX);
      if (typeof data.imageZIndex === 'number') setImageZIndex(data.imageZIndex);
      if (typeof data.imageSide === 'string') setImageSide(data.imageSide);
      setSelectedTextId(null);
      setEditingTextId(null);
      toast.success('Création chargée.');
    } catch(e) { console.error('Load error', e); toast.error('Erreur lors du chargement.'); }
  };
  const generateShareLink = async () => {
    try {
      const payload = btoa(encodeURIComponent(JSON.stringify(serializeCustomization())));
      const url = `${window.location.origin}${window.location.pathname}?c=${payload}`;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        toast.success('Lien de partage copié.');
      } else {
        window.prompt('Copiez ce lien de partage :', url);
        toast.info('Copiez le lien depuis la boîte de dialogue.');
      }
    } catch(e) { console.error('Share link error', e); toast.error('Erreur lors de la génération du lien.'); }
  };
  useEffect(() => {
    try { localStorage.setItem('cw_auto_customization', JSON.stringify(serializeCustomization())); } catch(e) {}
  }, [
    textLayers,
    selectedColor,
    showBack,
    uploadedImageUrl,
    imageXPercent,
    imageYPercent,
    imageScale,
    imageRotation,
    imageVisible,
    imageLocked,
    imageOpacity,
    imageFlipX,
    imageZIndex,
    imageSide,
  ]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c');
    if (c) {
      try {
        const data = JSON.parse(decodeURIComponent(atob(c)));
        setTextLayers(data.textLayers || []);
        if (typeof data.showBack === 'boolean') setShowBack(data.showBack);
        if (data.selectedColor) setSelectedColor(data.selectedColor);
        if (typeof data.uploadedImageUrl === 'string') setUploadedImageUrl(data.uploadedImageUrl);
        if (typeof data.imageXPercent === 'number') setImageXPercent(data.imageXPercent);
        if (typeof data.imageYPercent === 'number') setImageYPercent(data.imageYPercent);
        if (typeof data.imageScale === 'number') setImageScale(data.imageScale);
        if (typeof data.imageRotation === 'number') setImageRotation(data.imageRotation);
        if (typeof data.imageVisible === 'boolean') setImageVisible(data.imageVisible);
        if (typeof data.imageLocked === 'boolean') setImageLocked(data.imageLocked);
        if (typeof data.imageOpacity === 'number') setImageOpacity(data.imageOpacity);
        if (typeof data.imageFlipX === 'boolean') setImageFlipX(data.imageFlipX);
        if (typeof data.imageZIndex === 'number') setImageZIndex(data.imageZIndex);
        if (typeof data.imageSide === 'string') setImageSide(data.imageSide);
      } catch(e) { console.error('Share decode error', e); }
    }
  }, []);

  const getBaseImageSrc = () => {
    const colorImages = selectedModel?.imagesByColor?.[selectedColor];
    const defaultImages = selectedModel?.images;
    return showBack 
      ? (colorImages?.back || defaultImages?.back || DEFAULT_MODEL_PLACEHOLDER.images.back)
      : (colorImages?.front || defaultImages?.front || DEFAULT_MODEL_PLACEHOLDER.images.front);
  };

  const downloadPreviewImage = async () => {
    const baseSrc = getBaseImageSrc();
    const canvas = document.createElement('canvas');
    const size = 2048;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const loadImg = (src) => new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin='anonymous'; img.onload=()=>resolve(img); img.onerror=reject; img.src=src; });
    try {
      const baseImg = await loadImg(baseSrc);
      ctx.drawImage(baseImg, 0, 0, size, size);

      // Construire les calques visibles (image + textes), triés par z-index
      const layers = [];
      if (uploadedImageUrl && (showBack ? imageSide === 'back' : imageSide === 'front') && imageVisible) {
        layers.push({ type: 'image', zIndex: imageZIndex });
      }
      const visibleTexts = textLayers.filter(t => (showBack ? t.side==='back' : t.side==='front') && (t.visible ?? true));
      for (const t of visibleTexts) {
        layers.push({ type: 'text', zIndex: t.zIndex || 3, data: t });
      }
      layers.sort((a,b)=> (a.zIndex||0) - (b.zIndex||0));

      for (const layer of layers) {
        if (layer.type === 'image') {
          const upImg = await loadImg(uploadedImageUrl);
          const w = size * 0.5;
          const h = upImg.height * (w / upImg.width);
          const x = (imageXPercent/100)*size; const y = (imageYPercent/100)*size;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((imageRotation||0) * Math.PI/180);
          ctx.scale((imageFlipX ? -1 : 1) * (imageScale||1), imageScale||1);
          ctx.globalAlpha = imageOpacity ?? 1;
          ctx.drawImage(upImg, -w/2, -h/2, w, h);
          ctx.restore();
        } else if (layer.type === 'text') {
          const t = layer.data;
          const x = (t.xPercent/100)*size; const y = (t.yPercent/100)*size;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((t.rotation||0)*Math.PI/180);
          ctx.scale(t.scale||1, t.scale||1);
          const weight = t.fontWeight || 400; const style = t.fontStyle || 'normal';
          const family = (t.fontFamily || 'Arial').split(',')[0];
          ctx.font = `${style} ${weight} ${t.fontSize||32}px ${family}`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.globalAlpha = t.opacity ?? 1;
          if (t.shadowEnabled) { ctx.shadowColor = t.shadowColor || 'rgba(0,0,0,0.3)'; ctx.shadowBlur = t.shadowBlur || 0; ctx.shadowOffsetX = t.shadowX || 0; ctx.shadowOffsetY = t.shadowY || 0; }
          const text = t.content || '';
          const metricsW = ctx.measureText(text).width;
          const metricsH = (t.fontSize||32) * (t.lineHeight || 1.2);
          if (t.backgroundEnabled) {
            ctx.fillStyle = t.backgroundColor || '#ffffff';
            const pad = t.padding || 4;
            ctx.fillRect(-metricsW/2 - pad, -metricsH/2 - pad, metricsW + pad*2, metricsH + pad*2);
          }
          if (t.borderEnabled) {
            ctx.strokeStyle = t.borderColor || '#000';
            ctx.lineWidth = t.borderWidth || 1;
            const pad = t.padding || 4;
            ctx.strokeRect(-metricsW/2 - pad, -metricsH/2 - pad, metricsW + pad*2, metricsH + pad*2);
          }
          ctx.fillStyle = t.color || '#111827';
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
      const data = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = data; a.download = 'customwear-apercu.png'; a.click();
      toast.success('Aperçu téléchargé.');
    } catch(e) { console.error('Preview download error', e); toast.error("Erreur lors du téléchargement de l'aperçu."); }
  };

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
          setSelectedSize(Array.isArray(firstActive.sizes) && firstActive.sizes.length ? firstActive.sizes[0] : DEFAULT_MODEL_PLACEHOLDER.sizes[0]);
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

  const availableSizes = useMemo(() => {
    const fallback = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    const base = Array.isArray(selectedModel?.sizes) && selectedModel.sizes.length > 0
      ? selectedModel.sizes
      : fallback;
    return sortSizes(base);
  }, [selectedModel]);

  const activeModels = useMemo(() => {
    return models.filter(m => m?.active !== false);
  }, [models]);

  // removed uniqueTypes/uniqueGenders/uniqueCategories memos

  const handleModelChange = (modelId) => {
    const next = activeModels.find(m => String(m._id) === String(modelId)) || selectedModel;
    setSelectedModel(next);
    if (next) {
      setSelectedColor(Array.isArray(next.colors) && next.colors.length ? next.colors[0] : selectedColor);
      const sorted = Array.isArray(next.sizes) ? sortSizes(next.sizes) : [];
      setSelectedSize(sorted.length ? sorted[0] : selectedSize);
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
    
    // Précharger aussi les images par couleur si disponibles
    const colorImages = selectedModel?.imagesByColor?.[selectedColor];
    const colorFront = colorImages?.front;
    const colorBack = colorImages?.back;
    
    [front, back, colorFront, colorBack].forEach(src => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    });
  }, [selectedModel, selectedColor]);

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
          <div className="model-price-inline" aria-label="Prix du modèle">
            {Number.isFinite(Number(selectedModel?.basePrice)) ? `${Number(selectedModel.basePrice).toFixed(2)} €` : `${Number(DEFAULT_MODEL_PLACEHOLDER.basePrice).toFixed(2)} €`}
          </div>
        </div>
      </div>
      <nav className="models-subnav" aria-label="Sous-navigation">
        <NavLink to="/customize" className={({ isActive }) => `subnav-link${isActive ? ' active' : ''}`}>Personnalisation</NavLink>
        <NavLink to="/products" className={({ isActive }) => `subnav-link${isActive ? ' active' : ''}`}>Produits disponibles</NavLink>
        <NavLink to="/models" className={({ isActive }) => `subnav-link${isActive ? ' active' : ''}`}>Modèles</NavLink>
      </nav>

      <div className="customize-content">
        {/* Panneau gauche: choix modèle et infos */}
        <div className="customize-tools">
          <div
            className={`panel ${panelOpen.produit ? 'open' : 'collapsed'}`}
            onClick={() => togglePanel('produit')}
            role="button"
            aria-expanded={panelOpen.produit}
          >
            <div className="panel-header">
              <h3>Filtre les modèles</h3>
              <span className="panel-arrow" aria-hidden="true"></span>
            </div>
            <div className="panel-content" onClick={(e) => e.stopPropagation()}>
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

              <div className="form-group">
                <label>Prix du modèle</label>
                <div className="model-price-inline">
                  {Number.isFinite(Number(selectedModel?.basePrice)) ? `${Number(selectedModel.basePrice).toFixed(2)} €` : `${Number(DEFAULT_MODEL_PLACEHOLDER.basePrice).toFixed(2)} €`}
                </div>
              </div>
              
              <div className="form-group">
                <label>Couleur</label>
                <div className="options-row">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      className={`chip color-chip ${selectedColor === color ? 'active' : ''}`}
                      onClick={() => setSelectedColor(color)}
                    >
                      <div 
                        className="color-swatch" 
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Tailles</label>
                <div className="options-row">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      className={`chip ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                      type="button"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>


          <div
            className={`panel ${panelOpen.image ? 'open' : 'collapsed'}`}
            onClick={() => togglePanel('image')}
            role="button"
            aria-expanded={panelOpen.image}
          >
            <div className="panel-header">
              <h3>Ajouter une image</h3>
              <span className="panel-arrow" aria-hidden="true"></span>
            </div>
            <div className="panel-content" onClick={(e) => e.stopPropagation()}>
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
              {/* Nouveaux contrôles avancés */}
              <div className="form-group">
                <div className="options-row">
                  <label className="chip"><input type="checkbox" checked={imageVisible} onChange={() => setImageVisible(v => !v)} /> Visible</label>
                  <button type="button" className={`chip ${imageLocked ? 'active' : ''}`} onClick={() => setImageLocked(v => !v)}>{imageLocked ? 'Déverrouiller' : 'Verrouiller'}</button>
                  <button type="button" className="chip" onClick={() => setImageSide(s => s === 'front' ? 'back' : 'front')}>{imageSide === 'front' ? 'Envoyer à arrière' : 'Envoyer à avant'}</button>
                </div>
              </div>
              <div className="form-group">
                <label>Opacité</label>
                <input type="range" min="0" max="1" step="0.05" value={imageOpacity} onChange={(e) => setImageOpacity(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <div className="options-row">
                  <button type="button" className="chip" onClick={() => setImageFlipX(f => !f)}>{imageFlipX ? 'Annuler flip horizontal' : 'Flip horizontal'}</button>
                  <button type="button" className="chip" onClick={() => setImageZIndex(z => Math.max(1, z - 1))}>Arrière-plan</button>
                  <button type="button" className="chip" onClick={() => setImageZIndex(z => Math.min(10, z + 1))}>Premier plan</button>
                </div>
                <small style={{ color:'#6b7280' }}>z-index: {imageZIndex} • face: {imageSide}</small>
              </div>
              <div className="form-group">
                <label>Position</label>
                <div className="options-row">
                  <button type="button" className="chip" onClick={() => setImageXPercent(p => Math.max(5, p - 5))}>←</button>
                  <button type="button" className="chip" onClick={() => setImageXPercent(p => Math.min(95, p + 5))}>→</button>
                  <button type="button" className="chip" onClick={() => setImageYPercent(p => Math.max(5, p - 5))}>↑</button>
                  <button type="button" className="chip" onClick={() => setImageYPercent(p => Math.min(95, p + 5))}>↓</button>
                  <button type="button" className="chip" onClick={() => { setImageXPercent(50); setImageYPercent(50); }}>Centrer</button>
                </div>
              </div>
              <div className="form-group">
                <div className="options-row">
                  <button type="button" className="chip" onClick={() => { setImageXPercent(50); setImageYPercent(50); setImageScale(1); setImageRotation(0); setImageOpacity(1); setImageFlipX(false); setImageZIndex(2); setImageSide('front'); }}>Réinitialiser</button>
                  <button type="button" className="chip" onClick={() => { if (uploadedImageUrl && uploadedImageUrl.startsWith('blob:')) { try { URL.revokeObjectURL(uploadedImageUrl); } catch(e) {} } setUploadedImageUrl(''); }}>Supprimer l'image</button>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`panel ${panelOpen.texte ? 'open' : 'collapsed'}`}
            onClick={() => togglePanel('texte')}
            role="button"
            aria-expanded={panelOpen.texte}
          >
            <div className="panel-header">
              <h3>Ajouter un texte</h3>
              <span className="panel-arrow" aria-hidden="true"></span>
            </div>
            <div className="panel-content" onClick={(e) => e.stopPropagation()}>
              <div className="form-group">
                <button type="button" className="chip" onClick={addTextLayer}>Ajouter un texte</button>
                <div className="options-row" style={{ marginTop: '0.5rem' }}>
                  <label>Limite caractères</label>
                  <input type="number" min="1" max="200" value={textCharLimit} onChange={(e)=>setTextCharLimit(Number(e.target.value)||50)} />
                </div>
              </div>

              <div className="form-group">
                <label>Zones de texte</label>
                <div className="layers-list">
                  {textLayers.length === 0 && <p style={{ color: '#6b7280' }}>Aucun texte ajouté.</p>}
                  {textLayers.map((t, idx)=> (
                    <div key={t.id} className={`layer-item ${selectedTextId===t.id ? 'active' : ''}`}>
                      <div className="layer-row">
                        <button type="button" className="chip" onClick={()=>setSelectedTextId(t.id)}>{t.name || `Texte ${idx+1}`}</button>
                        <input type="text" value={t.name || ''} onChange={(e)=>renameTextLayer(t.id, e.target.value)} placeholder={`Texte ${idx+1}`} style={{ marginLeft: '0.5rem' }} />
                      </div>
                      <div className="layer-actions">
                        <label className="chip"><input type="checkbox" checked={t.visible ?? true} onChange={()=>toggleVisibilityTextLayer(t.id)} /> Visible</label>
                        <button type="button" className={`chip ${t.locked ? 'active' : ''}`} onClick={()=>toggleLockTextLayer(t.id)}>{t.locked ? 'Déverrouiller' : 'Verrouiller'}</button>
                        <button type="button" className="chip" onClick={()=>moveTextLayerUp(t.id)}>Monter</button>
                        <button type="button" className="chip" onClick={()=>moveTextLayerDown(t.id)}>Descendre</button>
                        <button type="button" className="chip" onClick={()=>bringTextLayerToFront(t.id)}>Premier plan</button>
                        <button type="button" className="chip" onClick={()=>sendTextLayerToBack(t.id)}>Arrière-plan</button>
                        <button type="button" className="chip" onClick={()=>updateTextLayer(t.id, { side: (t.side === 'front' ? 'back' : 'front') }, 'Basculer face')}>{t.side === 'front' ? 'Envoyer à arrière' : 'Envoyer à avant'}</button>
                        <button type="button" className="chip" onClick={()=>duplicateTextLayer(t.id)}>Dupliquer</button>
                        <button type="button" className="chip" onClick={()=>deleteTextLayer(t.id)} style={{ color:'#dc2626' }}>Supprimer</button>
                      </div>
                      <small style={{ color:'#6b7280' }}>z-index: {t.zIndex} • face: {t.side}</small>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTextId && (
                <>
                  <div className="form-group">
                    <label>Contenu</label>
                    <input type="text" maxLength={textCharLimit} value={textLayers.find(t=>t.id===selectedTextId)?.content || ''} onChange={(e)=>updateTextLayer(selectedTextId, { content: e.target.value })} />
                    <small style={{ color:'#6b7280' }}>{ (textLayers.find(t=>t.id===selectedTextId)?.content?.length || 0) } / {textCharLimit}</small>
                  </div>

                  <div className="form-group">
                    <label>Couleur</label>
                    <input type="color" value={textLayers.find(t=>t.id===selectedTextId)?.color || '#111827'} onChange={(e)=>updateTextLayer(selectedTextId, { color: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label>Police</label>
                    <select value={textLayers.find(t=>t.id===selectedTextId)?.fontFamily || 'Arial, Helvetica, sans-serif'} onChange={(e)=>updateTextLayer(selectedTextId, { fontFamily: e.target.value })}>
                      <option value="Arial, Helvetica, sans-serif">Arial</option>
                      <option value="'Times New Roman', Times, serif">Times New Roman</option>
                      <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                      <option value="Montserrat, Arial, sans-serif">Montserrat</option>
                      <option value="Roboto, Arial, sans-serif">Roboto</option>
                      <option value="'Open Sans', Arial, sans-serif">Open Sans</option>
                      <option value="Courier New, monospace">Courier New</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Taille</label>
                    <input type="range" min="8" max="200" step="1" value={textLayers.find(t=>t.id===selectedTextId)?.fontSize || 32} onChange={(e)=>updateTextLayer(selectedTextId, { fontSize: Number(e.target.value) })} />
                  </div>

                  <div className="options-row">
                    <button className={`chip ${textLayers.find(t=>t.id===selectedTextId)?.fontWeight === 700 ? 'active' : ''}`} onClick={()=>updateTextLayer(selectedTextId, { fontWeight: (textLayers.find(t=>t.id===selectedTextId)?.fontWeight===700) ? 400 : 700 })}>Gras</button>
                    <button className={`chip ${textLayers.find(t=>t.id===selectedTextId)?.fontStyle === 'italic' ? 'active' : ''}`} onClick={()=>updateTextLayer(selectedTextId, { fontStyle: (textLayers.find(t=>t.id===selectedTextId)?.fontStyle==='italic') ? 'normal' : 'italic' })}>Italique</button>
                    <button className={`chip ${textLayers.find(t=>t.id===selectedTextId)?.textDecoration === 'underline' ? 'active' : ''}`} onClick={()=>updateTextLayer(selectedTextId, { textDecoration: (textLayers.find(t=>t.id===selectedTextId)?.textDecoration==='underline') ? 'none' : 'underline' })}>Souligné</button>
                  </div>

                  <div className="form-group">
                    <label>Espacement</label>
                    <div className="options-row">
                      <div>
                        <span>Lettres</span>
                        <input type="range" min="-2" max="10" step="0.5" value={textLayers.find(t=>t.id===selectedTextId)?.letterSpacing || 0} onChange={(e)=>updateTextLayer(selectedTextId, { letterSpacing: Number(e.target.value) })} />
                      </div>
                      <div>
                        <span>Lignes</span>
                        <input type="range" min="0.8" max="2.5" step="0.05" value={textLayers.find(t=>t.id===selectedTextId)?.lineHeight || 1.2} onChange={(e)=>updateTextLayer(selectedTextId, { lineHeight: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Opacité</label>
                    <input type="range" min="0" max="100" step="1" value={Math.round((textLayers.find(t=>t.id===selectedTextId)?.opacity || 1)*100)} onChange={(e)=>updateTextLayer(selectedTextId, { opacity: Number(e.target.value)/100 })} />
                  </div>

                  <div className="form-group">
                    <label>Alignement horizontal</label>
                    <div className="options-row">
                      <button className="chip" onClick={()=>alignTextHorizontal(selectedTextId,'left')}>Gauche</button>
                      <button className="chip" onClick={()=>alignTextHorizontal(selectedTextId,'center')}>Centre</button>
                      <button className="chip" onClick={()=>alignTextHorizontal(selectedTextId,'right')}>Droite</button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Alignement vertical</label>
                    <div className="options-row">
                      <button className="chip" onClick={()=>alignTextVertical(selectedTextId,'top')}>Haut</button>
                      <button className="chip" onClick={()=>alignTextVertical(selectedTextId,'middle')}>Milieu</button>
                      <button className="chip" onClick={()=>alignTextVertical(selectedTextId,'bottom')}>Bas</button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Rotation</label>
                    <input type="range" min="-180" max="180" step="1" value={textLayers.find(t=>t.id===selectedTextId)?.rotation || 0} onChange={(e)=>updateTextLayer(selectedTextId, { rotation: Number(e.target.value) })} />
                    <div className="options-row">
                      <button className="chip" onClick={()=>rotateTextTo(selectedTextId, 0)}>0°</button>
                      <button className="chip" onClick={()=>rotateTextTo(selectedTextId, 45)}>45°</button>
                      <button className="chip" onClick={()=>rotateTextTo(selectedTextId, 90)}>90°</button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Échelle</label>
                    <input type="range" min="0.5" max="3" step="0.05" value={textLayers.find(t=>t.id===selectedTextId)?.scale || 1} onChange={(e)=>updateTextLayer(selectedTextId, { scale: Number(e.target.value) })} />
                  </div>

                  <div className="form-group">
                    <label>Fond</label>
                    <div className="options-row">
                      <label><input type="checkbox" checked={textLayers.find(t=>t.id===selectedTextId)?.backgroundEnabled || false} onChange={(e)=>updateTextLayer(selectedTextId, { backgroundEnabled: e.target.checked })} /> Activer</label>
                      <input type="color" disabled={!textLayers.find(t=>t.id===selectedTextId)?.backgroundEnabled} value={textLayers.find(t=>t.id===selectedTextId)?.backgroundColor || '#ffffff'} onChange={(e)=>updateTextLayer(selectedTextId, { backgroundColor: e.target.value })} />
                      <div>
                        <span>Padding</span>
                        <input type="range" min="0" max="40" step="1" disabled={!textLayers.find(t=>t.id===selectedTextId)?.backgroundEnabled} value={textLayers.find(t=>t.id===selectedTextId)?.padding || 4} onChange={(e)=>updateTextLayer(selectedTextId, { padding: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Contour</label>
                    <div className="options-row">
                      <label><input type="checkbox" checked={textLayers.find(t=>t.id===selectedTextId)?.borderEnabled || false} onChange={(e)=>updateTextLayer(selectedTextId, { borderEnabled: e.target.checked })} /> Activer</label>
                      <input type="color" disabled={!textLayers.find(t=>t.id===selectedTextId)?.borderEnabled} value={textLayers.find(t=>t.id===selectedTextId)?.borderColor || '#000000'} onChange={(e)=>updateTextLayer(selectedTextId, { borderColor: e.target.value })} />
                      <div>
                        <span>Épaisseur</span>
                        <input type="range" min="0" max="10" step="1" disabled={!textLayers.find(t=>t.id===selectedTextId)?.borderEnabled} value={textLayers.find(t=>t.id===selectedTextId)?.borderWidth || 0} onChange={(e)=>updateTextLayer(selectedTextId, { borderWidth: Number(e.target.value) })} />
                      </div>
                      <select disabled={!textLayers.find(t=>t.id===selectedTextId)?.borderEnabled} value={textLayers.find(t=>t.id===selectedTextId)?.borderStyle || 'solid'} onChange={(e)=>updateTextLayer(selectedTextId, { borderStyle: e.target.value })}>
                        <option value="solid">Solide</option>
                        <option value="dashed">Pointillé</option>
                        <option value="double">Double</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Ombre</label>
                    <div className="options-row">
                      <label><input type="checkbox" checked={textLayers.find(t=>t.id===selectedTextId)?.shadowEnabled || false} onChange={(e)=>updateTextLayer(selectedTextId, { shadowEnabled: e.target.checked })} /> Activer</label>
                      <input type="color" disabled={!textLayers.find(t=>t.id===selectedTextId)?.shadowEnabled} value={textLayers.find(t=>t.id===selectedTextId)?.shadowColor || 'rgba(0,0,0,0.3)'} onChange={(e)=>updateTextLayer(selectedTextId, { shadowColor: e.target.value })} />
                      <div>
                        <span>X</span>
                        <input type="range" min="-50" max="50" step="1" disabled={!textLayers.find(t=>t.id===selectedTextId)?.shadowEnabled} value={textLayers.find(t=>t.id===selectedTextId)?.shadowX || 0} onChange={(e)=>updateTextLayer(selectedTextId, { shadowX: Number(e.target.value) })} />
                      </div>
                      <div>
                        <span>Y</span>
                        <input type="range" min="-50" max="50" step="1" disabled={!textLayers.find(t=>t.id===selectedTextId)?.shadowEnabled} value={textLayers.find(t=>t.id===selectedTextId)?.shadowY || 0} onChange={(e)=>updateTextLayer(selectedTextId, { shadowY: Number(e.target.value) })} />
                      </div>
                      <div>
                        <span>Flou</span>
                        <input type="range" min="0" max="50" step="1" disabled={!textLayers.find(t=>t.id===selectedTextId)?.shadowEnabled} value={textLayers.find(t=>t.id===selectedTextId)?.shadowBlur || 0} onChange={(e)=>updateTextLayer(selectedTextId, { shadowBlur: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Zone d'aperçu */}
        <div className="customize-preview">
          <div className="preview-toolbar">
            <div className="options-row">
              <button className={`chip ${!showBack ? 'active' : ''}`} onClick={() => setShowBack(false)}>Avant</button>
              <button className={`chip ${showBack ? 'active' : ''}`} onClick={() => setShowBack(true)}>Arrière</button>
              <button className={`chip ${previewMode ? 'active' : ''}`} onClick={() => setPreviewMode(!previewMode)}>{previewMode ? 'Mode édition' : 'Mode aperçu'}</button>
              <div className="zoom-controls">
                <span>Zoom</span>
                <input type="range" min="0.5" max="3" step="0.05" value={canvasZoom} onChange={(e)=>setCanvasZoom(Number(e.target.value))} />
                <span>{Math.round(canvasZoom*100)}%</span>
              </div>
            </div>
          </div>

          <PreviewCanvas
            showBack={showBack}
            selectedModel={selectedModel}
            selectedColor={selectedColor}
            uploadedImageUrl={uploadedImageUrl}
            imageXPercent={imageXPercent}
            imageYPercent={imageYPercent}
            imageScale={imageScale}
            imageRotation={imageRotation}
            // add image control props
            imageVisible={imageVisible}
            imageLocked={imageLocked}
            imageOpacity={imageOpacity}
            imageFlipX={imageFlipX}
            imageZIndex={imageZIndex}
            imageSide={imageSide}
            setImageXPercent={setImageXPercent}
            setImageYPercent={setImageYPercent}
            setImageRotation={setImageRotation}
            canvasRef={canvasRef}
            textLayers={textLayers}
            selectedTextId={selectedTextId}
            setSelectedTextId={setSelectedTextId}
            updateTextLayer={updateTextLayer}
            editingTextId={editingTextId}
            setEditingTextId={setEditingTextId}
            previewMode={previewMode}
            canvasZoom={canvasZoom}
          />
        </div>

        {/* Panneau droit: galerie d'images et actions */}
        <div className="preview-sidebar-right">
          <div className="panel">
            <h3>Galerie d'images</h3>
            <div className="image-gallery">
              {/* Images par défaut */}
              {selectedModel?.images && (
                <div className="gallery-section">
                  <h4>Images par défaut</h4>
                  <div className="gallery-grid">
                    {selectedModel.images.front && (
                      <div className="gallery-thumb" onClick={() => setShowBack(false)}>
                        <img src={selectedModel.images.front} alt="Avant par défaut" />
                        <span>Avant</span>
                      </div>
                    )}
                    {selectedModel.images.back && (
                      <div className="gallery-thumb" onClick={() => setShowBack(true)}>
                        <img src={selectedModel.images.back} alt="Arrière par défaut" />
                        <span>Arrière</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Images par couleur - filtrées par la couleur sélectionnée */}
              {selectedModel?.imagesByColor && Object.keys(selectedModel.imagesByColor).length > 0 && (
                <div className="gallery-section">
                  <h4>Images par couleur</h4>
                  {(() => {
                    const images = selectedModel.imagesByColor[selectedColor];
                    if (!images || (!images.front && !images.back)) {
                      return (
                        <p style={{ color: '#6b7280' }}>
                          Aucune image disponible pour la couleur "{selectedColor}".
                        </p>
                      );
                    }
                    return (
                      <div className="color-gallery">
                        <h5>{selectedColor}</h5>
                        <div className="gallery-grid">
                          {images.front && (
                            <div
                              className="gallery-thumb"
                              onClick={() => {
                                setShowBack(false);
                              }}
                            >
                              <img src={images.front} alt={`${selectedColor} avant`} />
                              <span>Avant</span>
                            </div>
                          )}
                          {images.back && (
                            <div
                              className="gallery-thumb"
                              onClick={() => {
                                setShowBack(true);
                              }}
                            >
                              <img src={images.back} alt={`${selectedColor} arrière`} />
                              <span>Arrière</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          <CustomizationPricing />
          <CustomizationSelector
            baseModelPrice={Number(selectedModel?.basePrice) || Number(DEFAULT_MODEL_PLACEHOLDER.basePrice)}
            selection={{
              text: {
                front: Array.isArray(textLayers) && textLayers.some(t => t?.side === 'front' && (t?.visible ?? true)),
                back: Array.isArray(textLayers) && textLayers.some(t => t?.side === 'back' && (t?.visible ?? true)),
              },
              image: {
                front: Boolean(uploadedImageUrl && imageVisible && imageSide === 'front'),
                back: Boolean(uploadedImageUrl && imageVisible && imageSide === 'back'),
              },
            }}
            onTotals={(t) => setComputedTotals(t)}
          />

          

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
            <div className="options-row">
              <button className="chip" onClick={saveCustomizationLocal}>Enregistrer la création</button>
              <button className="chip" onClick={loadCustomizationLocal}>Charger la création</button>
              <button className="chip" onClick={generateShareLink}>Copier lien de partage</button>
              <button className="chip" onClick={downloadPreviewImage}>Télécharger l'aperçu</button>
            </div>
            <div className="history-log" style={{ marginTop: 8 }}>
              <p style={{ color: '#6b7280' }}>Historique des actions</p>
              <div className="options-row">
                <button className="chip" onClick={undo}>Annuler (Ctrl/Cmd+Z)</button>
                <button className="chip" onClick={redo}>Rétablir (Ctrl/Cmd+Y)</button>
              </div>
              <ul className="history-list">
                {historyActions.slice(-10).map((h, i) => (
                  <li key={i} style={{ color: '#6b7280' }}>{h}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="panel">
            <div className="customize-actions">
              <button className="add-to-cart-btn" onClick={handleAddToCartCustomized} title="Ajouter au panier">
                <FiShoppingCart /> Ajouter au panier
              </button>
              <button className="checkout-btn" onClick={handleCheckoutCustomized} title="Paiement">
                <FiCreditCard /> Paiement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customize;

// Composant d'aperçu isolé et mémoïsé (défini avant usage)
const PreviewCanvas = React.memo(({ showBack, selectedModel, selectedColor, uploadedImageUrl, imageXPercent, imageYPercent, imageScale, imageRotation, imageVisible, imageLocked, imageOpacity, imageFlipX, imageZIndex, imageSide, setImageXPercent, setImageYPercent, setImageRotation, canvasRef, textLayers, selectedTextId, setSelectedTextId, updateTextLayer, editingTextId, setEditingTextId, previewMode, canvasZoom }) => {
  // Priorité : images par couleur > images par défaut > placeholder
  const colorImages = selectedModel?.imagesByColor?.[selectedColor];
  const defaultImages = selectedModel?.images;
  
  const baseSrc = showBack 
    ? (colorImages?.back || defaultImages?.back || DEFAULT_MODEL_PLACEHOLDER.images.back)
    : (colorImages?.front || defaultImages?.front || DEFAULT_MODEL_PLACEHOLDER.images.front);
    
  // État d'interaction (drag/rotate)
  const dragState = React.useRef(null);
  const rotateState = React.useRef(null);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // Drag image
  const onImagePointerDown = (e) => {
    if (imageLocked) return;
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX; const startY = e.clientY;
    const origX = imageXPercent; const origY = imageYPercent;
    const onMove = (ev) => {
      const dxPx = ev.clientX - startX;
      const dyPx = ev.clientY - startY;
      const dxPercent = (dxPx / rect.width) * 100;
      const dyPercent = (dyPx / rect.height) * 100;
      const nx = clamp(origX + dxPercent, 5, 95);
      const ny = clamp(origY + dyPercent, 5, 95);
      setImageXPercent(nx);
      setImageYPercent(ny);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Rotate image handle
  const onImageRotatePointerDown = (e) => {
    if (imageLocked) return;
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + (imageXPercent / 100) * rect.width;
    const centerY = rect.top + (imageYPercent / 100) * rect.height;
    const onMove = (ev) => {
      const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI;
      let snapped = angle;
      if (ev.shiftKey) {
        const increments = [ -180, -135, -90, -45, 0, 45, 90, 135, 180 ];
        snapped = increments.reduce((prev, curr)=> Math.abs(curr-angle) < Math.abs(prev-angle) ? curr : prev, 0);
      }
      setImageRotation(snapped);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Handlers pour les calques de texte
  const onLayerPointerDown = (t, e) => {
    if (t.locked) return;
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSelectedTextId(t.id);
    const startX = e.clientX; const startY = e.clientY;
    dragState.current = { id: t.id, startX, startY, origX: t.xPercent, origY: t.yPercent };
    const onMove = (ev) => {
      const dxPx = ev.clientX - startX;
      const dyPx = ev.clientY - startY;
      const dxPercent = (dxPx / rect.width) * 100;
      const dyPercent = (dyPx / rect.height) * 100;
      const nx = Math.max(5, Math.min(95, dragState.current.origX + dxPercent));
      const ny = Math.max(5, Math.min(95, dragState.current.origY + dyPercent));
      updateTextLayer(dragState.current.id, { xPercent: nx, yPercent: ny });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dragState.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onRotatePointerDown = (t, e) => {
    if (t.locked) return;
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + (t.xPercent / 100) * rect.width;
    const centerY = rect.top + (t.yPercent / 100) * rect.height;
    rotateState.current = { id: t.id, centerX, centerY };
    const onMove = (ev) => {
      const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI;
      let snapped = angle;
      if (ev.shiftKey) {
        const increments = [ -180, -135, -90, -45, 0, 45, 90, 135, 180 ];
        snapped = increments.reduce((prev, curr)=> Math.abs(curr-angle) < Math.abs(prev-angle) ? curr : prev, 0);
      }
      updateTextLayer(rotateState.current.id, { rotation: snapped });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      rotateState.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onDoubleClick = (t, e) => {
    if (t.locked) return;
    setSelectedTextId(t.id);
    setEditingTextId(t.id);
  };

  const onEditInput = (t, e) => {
    const next = e.currentTarget.textContent || '';
    updateTextLayer(t.id, { content: next.slice(0, 200) });
  };

  const selected = selectedTextId ? textLayers.find(x=>x.id===selectedTextId) : null;
  const nearCenterX = selected ? Math.abs((selected.xPercent ?? 0) - 50) < 1 : false;
  const nearCenterY = selected ? Math.abs((selected.yPercent ?? 0) - 50) < 1 : false;

  return (
    <div className={`canvas-container ${previewMode ? 'preview-mode' : ''}`} ref={canvasRef} onPointerDown={() => setEditingTextId(null)} style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'center center' }}>
      <img className="product-base" src={baseSrc} alt="Base produit" />
      {uploadedImageUrl && (showBack ? imageSide === 'back' : imageSide === 'front') && imageVisible && (
        <>
          <img
            src={uploadedImageUrl}
            alt="Upload"
            className="uploaded-image"
            style={{
              left: `${imageXPercent}%`,
              top: `${imageYPercent}%`,
              transform: `translate(-50%, -50%) scale(${imageFlipX ? -imageScale : imageScale}, ${imageScale}) rotate(${imageRotation}deg)`,
              width: '50%',
              zIndex: imageZIndex,
              opacity: imageOpacity,
            }}
            onPointerDown={onImagePointerDown}
          />
          {!previewMode && !imageLocked && (
            <div
              className="rotate-handle"
              style={{ left: `${imageXPercent}%`, top: `calc(${imageYPercent}% - 24px)` }}
              onPointerDown={onImageRotatePointerDown}
            />
          )}
        </>
      )}

      {textLayers?.filter(t => (showBack ? t.side === 'back' : t.side === 'front') && (t.visible ?? true)).map((t) => (
        <div
          key={t.id}
          className={`text-layer ${!previewMode && selectedTextId === t.id ? 'selected' : ''} ${t.locked ? 'locked' : ''}`}
          style={{
            left: `${t.xPercent}%`,
            top: `${t.yPercent}%`,
            transform: `translate(-50%, -50%) rotate(${t.rotation || 0}deg) scale(${t.scale || 1})`,
            opacity: t.opacity ?? 1,
            zIndex: t.zIndex ?? 3,
          }}
          onPointerDown={(e)=>onLayerPointerDown(t,e)}
          onDoubleClick={(e)=>onDoubleClick(t,e)}
        >
          <div
            className="text-box"
            style={{
              fontFamily: t.fontFamily || 'Arial, Helvetica, sans-serif',
              fontSize: `${t.fontSize || 32}px`,
              fontWeight: t.fontWeight || 400,
              fontStyle: t.fontStyle || 'normal',
              letterSpacing: `${t.letterSpacing || 0}px`,
              lineHeight: t.lineHeight || 1.2,
              color: t.color || '#111827',
              textDecoration: t.textDecoration || 'none',
              background: t.backgroundEnabled ? (t.backgroundColor || '#ffffff') : 'transparent',
              padding: t.backgroundEnabled ? `${t.padding || 4}px` : '0px',
              border: t.borderEnabled ? `${t.borderWidth || 1}px ${t.borderStyle || 'solid'} ${t.borderColor || '#000'}` : 'none',
              boxShadow: t.shadowEnabled ? `${t.shadowX || 0}px ${t.shadowY || 0}px ${t.shadowBlur || 0}px ${t.shadowColor || 'rgba(0,0,0,0.3)'}` : 'none',
              cursor: t.locked ? 'not-allowed' : 'move',
              userSelect: editingTextId === t.id ? 'text' : 'none',
            }}
            contentEditable={editingTextId === t.id}
            suppressContentEditableWarning
            onInput={(e)=>onEditInput(t,e)}
            onBlur={()=>setEditingTextId(null)}
          >
            {t.content || 'Votre texte'}
          </div>

          {selectedTextId === t.id && !t.locked && (
            <>
              <div className="selection-ring" />
              <div className="rotate-handle" onPointerDown={(e)=>onRotatePointerDown(t,e)} />
            </>
          )}
        </div>
      ))}

      {nearCenterX && <div className="guide-line vertical" />}
      {nearCenterY && <div className="guide-line horizontal" />}
    </div>
  );
});