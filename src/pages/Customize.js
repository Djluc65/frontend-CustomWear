import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '../components/ui/button';
import { cn } from '../lib/cn';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { Checkbox } from '../components/ui/checkbox';
import { Select } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { modelsAPI, productsAPI, customizationPricingAPI, customizationsAPI, assistantAPI } from '../services/api';
import { sortSizes } from '../utils/sizes';
import './Customize.css';

import CustomizationPricing from '../components/Customization/CustomizationPricing';
import CustomizationSelector from '../components/Customization/CustomizationSelector';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiCreditCard, FiFilter, FiImage, FiType, FiSave } from 'react-icons/fi';
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
  'Gris': '#6b7280',
  'Vert palme': '#adfacaff',
  'Bleu palme': '#9fdcfdff',
};
const getColorHex = (name) => {
  if (!name) return '#ffffff';
  const key = String(name).trim();
  return COLOR_NAME_TO_HEX[key] || name;
};

// Helper pour convertir couleur en objet {r,g,b,a}
const parseColor = (colorStr) => {
  if (!colorStr) return { r: 0, g: 0, b: 0, a: 1 };
  if (colorStr === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  
  // Hex #RRGGBB
  if (colorStr.startsWith('#')) {
    const hex = colorStr.slice(1);
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1
      };
    }
  }
  
  // rgb/rgba
  if (colorStr.startsWith('rgb')) {
    const match = colorStr.match(/[\d.]+/g);
    if (match) {
      return {
        r: parseInt(match[0] || 0),
        g: parseInt(match[1] || 0),
        b: parseInt(match[2] || 0),
        a: match[3] !== undefined ? parseFloat(match[3]) : 1
      };
    }
  }
  
  return { r: 0, g: 0, b: 0, a: 1 };
};

const toRgbaString = ({ r, g, b, a }) => `rgba(${r}, ${g}, ${b}, ${a})`;
const toHexString = ({ r, g, b }) => {
  const toHex = (c) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
    // front: 'https://res.cloudinary.com/demo/image/upload/w_800,h_800,c_fit/sample.jpg',
    // back: 'https://res.cloudinary.com/demo/image/upload/w_800,h_800,c_fit/sample.jpg'
  },
};

// Helper pour le crop
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

async function canvasPreview(image, canvas, crop) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const rotateRads = 0;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();
  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  // ctx.rotate(rotateRads);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
  );
  ctx.restore();
}



const Customize = () => {
  const query = useQuery();
  const productId = query.get('product');
  // const variantId = query.get('variant');

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

  const handleAddToCartCustomized = async () => {
    if (!selectedTechnique) {
      toast.error("Veuillez choisir une technique d'impression avant de continuer.");
      return false;
    }
    try {
      const textFront = Array.isArray(textLayers) && textLayers.some(t => t?.side === 'front' && (t?.visible ?? true));
      const textBack = Array.isArray(textLayers) && textLayers.some(t => t?.side === 'back' && (t?.visible ?? true));
      const imageFront = Array.isArray(imageLayers) && imageLayers.some(i => i?.side === 'front' && (i?.visible ?? true));
      const imageBack = Array.isArray(imageLayers) && imageLayers.some(i => i?.side === 'back' && (i?.visible ?? true));
      const baseModelPrice = Number(selectedModel?.basePrice) || Number(DEFAULT_MODEL_PLACEHOLDER.basePrice);

      // Calcul serveur (source de vérité)
      let serverTotals = null;
      try {
        const resp = await customizationPricingAPI.calculatePrice({ textFront, textBack, imageFront, imageBack, baseModelPrice });
        serverTotals = resp?.data?.data?.totals || null;
      } catch (calcErr) {
        console.warn('[Customize] calculatePrice API failed, fallback to client totals', calcErr?.response?.data || calcErr);
      }

      const totalPrice = Number(
        (serverTotals?.grandTotal ?? computedTotals?.grandTotal ?? baseModelPrice)
      );

      const currentSideImage = (
        (selectedModel?.imagesByColor?.[selectedColor]?.[showBack ? 'back' : 'front']) ||
        (selectedModel?.images?.[showBack ? 'back' : 'front']) ||
        null
      );

      // Pour la compatibilité héritée, on prend la première image visible du côté affiché
      const primaryImage = imageLayers.find(img => (showBack ? img.side === 'back' : img.side === 'front') && (img.visible ?? true)) || imageLayers[0];

      const payload = {
        productId: selectedModel?._id,
        quantity: 1,
        price: totalPrice,
        image: currentSideImage,
        color: selectedColor,
        size: selectedSize,
        customization: {
          selection: {
            text: { front: textFront, back: textBack },
            image: { front: imageFront, back: imageBack },
          },
          textLayers,
          imageLayers, // Full layer support
          image: { // Legacy single image support
            url: primaryImage?.url || null,
            side: primaryImage?.side || (showBack ? 'back' : 'front'),
            visible: !!primaryImage,
          },
          totals: serverTotals || computedTotals || { baseModelPrice, customizationPrice: 0, grandTotal: baseModelPrice },
          technique: selectedTechnique,
        },
        product: {
          _id: selectedModel?._id,
          name: selectedModel?.name,
          price: { base: baseModelPrice },
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
      return true;
    } catch (err) {
      console.error('[Customize] handleAddToCartCustomized error', err);
      toast.error('Une erreur est survenue lors de l’ajout au panier');
      return false;
    }
  };

  const handleCheckoutCustomized = async () => {
    const success = await handleAddToCartCustomized();
    if (success) {
      navigate('/checkout');
    }
  };
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState(null);

  // Image Layers (remplace l'état d'image unique)
  const [imageLayers, setImageLayers] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);

  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;

  const [panelOpen, setPanelOpen] = useState({
    produit: isDesktop,
    image: false,
    texte: false,
    galerie: false,
    techniques: false,
    save: false,
  });
  const togglePanel = (key) => setPanelOpen(prev => ({ ...prev, [key]: !prev[key] }));
  // Barre contextuelle à côté du panel gauche
  const [contextOpen, setContextOpen] = useState(isDesktop);
  const [activeContextSection, setActiveContextSection] = useState(isDesktop ? 'produit' : null); // 'produit' | 'image' | 'texte' | 'save'
  // Références pour scroll vers les sections du panneau gauche
  const produitRef = useRef(null);
  const imageRef = useRef(null);
  const texteRef = useRef(null);
  const saveRef = useRef(null);
  const scrollToSection = (key) => {
    // Mobile: do not scroll page body, just open the panel
    if (window.innerWidth < 1024) {
      setPanelOpen(prev => ({ ...prev, [key]: true }));
      return;
    }
    const map = { produit: produitRef, image: imageRef, texte: texteRef, save: saveRef };
    const target = map[key];
    if (target && target.current) {
      try { target.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
    }
    setPanelOpen(prev => ({ ...prev, [key]: true }));
  };
  // Controls UI state
  // Bascule d'affichage des contrôles Image
  const [imageSizeOpen, setImageSizeOpen] = useState(false);
  const [imageRotationOpen, setImageRotationOpen] = useState(false);
  const [imageVisibilityOpen, setImageVisibilityOpen] = useState(false);
  const [imageOpacityOpen, setImageOpacityOpen] = useState(false);
  const [imagePositionOpen, setImagePositionOpen] = useState(false);
  const [imageUploaderOpen, setImageUploaderOpen] = useState(false);
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
  // Unité des règles de mesure
  const [rulerUnit, setRulerUnit] = useState('px'); // 'px' ou 'cm'
  // Repères utilisateur (guides)
  const [guideLines, setGuideLines] = useState([]); // {id, type: 'vertical'|'horizontal', percent, side}

  // Améliorations Sauvegarde/Aperçu
  const [savedName, setSavedName] = useState('');
  const [savedList, setSavedList] = useState(() => {
    try {
      const raw = localStorage.getItem('cw_customizations');
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch(_) { return []; }
  });
  const [hasAutoDraft, setHasAutoDraft] = useState(() => Boolean(localStorage.getItem('cw_auto_customization')));
  const [previewSize, setPreviewSize] = useState(2048);
  const [includeGuides, setIncludeGuides] = useState(false);
  const [serverLoadId, setServerLoadId] = useState('');

  const [activeTextInspectorTab, setActiveTextInspectorTab] = useState('content');

  useEffect(() => {
    if (selectedTextId) {
      setActiveTextInspectorTab('content');
    }
  }, [selectedTextId]);

  const [assistantInput, setAssistantInput] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');

  const handleAskAssistant = async (e) => {
    e.preventDefault();
    const message = assistantInput.trim();
    if (!message) return;
    setAssistantLoading(true);
    setAssistantError('');
    try {
      const summaryParts = [];
      if (selectedModel?.name) summaryParts.push(`Nom: ${selectedModel.name}`);
      if (selectedModel?.category) summaryParts.push(`Catégorie: ${selectedModel.category}`);
      if (selectedModel?.gender) summaryParts.push(`Genre: ${selectedModel.gender}`);
      if (selectedColor) summaryParts.push(`Couleur choisie: ${selectedColor}`);
      if (selectedSize) summaryParts.push(`Taille choisie: ${selectedSize}`);
      const productSummary = summaryParts.join(' | ');
      const res = await assistantAPI.ask({
        message,
        page: 'customize',
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
      // Ignore if input/textarea focused
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }

      // Arrow keys movement
      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      if (isArrow) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 0.5; // Shift for faster movement
        
        if (selectedImageId) {
          const img = imageLayers.find(i => i.id === selectedImageId);
          if (img && !img.locked) {
            let { xPercent, yPercent } = img;
            if (e.key === 'ArrowLeft') xPercent -= step;
            if (e.key === 'ArrowRight') xPercent += step;
            if (e.key === 'ArrowUp') yPercent -= step;
            if (e.key === 'ArrowDown') yPercent += step;
            // Clamp
            xPercent = Math.max(-20, Math.min(120, xPercent));
            yPercent = Math.max(-20, Math.min(120, yPercent));
            updateImageLayer(selectedImageId, { xPercent, yPercent });
          }
        } else if (selectedTextId) {
          const t = textLayers.find(x => x.id === selectedTextId);
          if (t && !t.locked) {
            let { xPercent, yPercent } = t;
            if (e.key === 'ArrowLeft') xPercent -= step;
            if (e.key === 'ArrowRight') xPercent += step;
            if (e.key === 'ArrowUp') yPercent -= step;
            if (e.key === 'ArrowDown') yPercent += step;
            // Clamp
            xPercent = Math.max(0, Math.min(100, xPercent));
            yPercent = Math.max(0, Math.min(100, yPercent));
            updateTextLayer(selectedTextId, { xPercent, yPercent }, 'Déplacer au clavier');
          }
        }
      }

      // Delete key
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        if (selectedImageId) {
             const img = imageLayers.find(i => i.id === selectedImageId);
             if (img && !img.locked) {
                 e.preventDefault();
                 deleteImageLayer(selectedImageId);
             }
        } else if (selectedTextId) {
             const t = textLayers.find(x => x.id === selectedTextId);
             if (t && !t.locked) {
                 e.preventDefault();
                 deleteTextLayer(selectedTextId);
             }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [textLayers, imageLayers, selectedImageId, selectedTextId]);

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
    strokeEnabled: false,
    strokeColor: '#000000',
    strokeWidth: 1,
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

  // --- Image Layers Helpers ---
  const createImageLayer = (url, overrides = {}) => ({
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    url,
    xPercent: 50,
    yPercent: 50,
    rotation: 0,
    scale: 1,
    opacity: 1,
    locked: false,
    visible: true,
    flipX: false,
    zIndex: 2,
    side: 'front',
    ...overrides,
  });

  const addImageLayer = (url, overrides = {}) => {
    const nextIndex = imageLayers.length + 2; 
    const next = createImageLayer(url, { side: showBack ? 'back' : 'front', zIndex: nextIndex, ...overrides });
    setImageLayers(prev => [...prev, next]);
    setSelectedImageId(next.id);
  };

  const updateImageLayer = (id, patch) => {
    setImageLayers(prev => prev.map(img => img.id === id ? { ...img, ...patch } : img));
  };

  const deleteImageLayer = (id) => {
    setImageLayers(prev => prev.filter(img => img.id !== id));
    if (selectedImageId === id) setSelectedImageId(null);
  };

  // CRUD des repères utilisateur
  const addGuideLine = (type) => {
    const id = 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const percent = 50;
    const side = showBack ? 'back' : 'front';
    setGuideLines(prev => [...prev, { id, type, percent, side }]);
  };
  const updateGuideLine = (id, updates) => {
    setGuideLines(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };
  const deleteGuideLine = (id) => {
    setGuideLines(prev => prev.filter(g => g.id !== id));
  };

  // Sauvegarde/partage et export
  const serializeCustomization = () => ({
    selectedColor,
    showBack,
    rulerUnit,
    guideLines,
    textLayers,
    imageLayers,
    selectedImageId,
  });

  // Helpers pour sauvegarde serveur
  const extractPrimaryTextConfig = (side) => {
    try {
      const visible = textLayers.filter(t => (t.side === side) && (t.visible ?? true));
      const t = visible[0];
      if (!t) return null;
      const alignMap = { left: 'left', center: 'center', right: 'right' };
      return {
        content: t.content || '',
        font: (t.fontFamily || 'Arial'),
        fontSize: Number(t.fontSize || 24),
        color: t.color || '#000000',
        rotation: Number(t.rotation || 0),
        align: alignMap[t.align || 'center'] || 'center',
        position: { x: Number(t.xPercent || 50), y: Number(t.yPercent || 50) },
        side: side || 'front'
      };
    } catch (_) { return null; }
  };

  const imageUrlToDataUrl = async (url, targetWidth = 1024) => {
    if (!url) return null;
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const ratio = img.height / img.width;
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth; canvas.height = Math.round(targetWidth * ratio);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  };

  const buildServerPayload = async () => {
    const side = showBack ? 'back' : 'front';
    const primaryText = extractPrimaryTextConfig(side);
    
    // Use first visible image on current side as primary for legacy structure
    const primaryImage = imageLayers.find(img => img.side === side && (img.visible ?? true));
    const dataUrl = primaryImage ? await imageUrlToDataUrl(primaryImage.url, 1024) : null;

    const productColorHex = getColorHex(selectedColor) || '#ffffff';
    return {
      productId: selectedModel?._id,
      productType: selectedModel?.category || 't-shirts',
      productColor: productColorHex,
      text: primaryText || undefined,
      image: {
        dataUrl: dataUrl || undefined,
        size: Number((primaryImage?.scale || 1) * 100),
        rotation: Number(primaryImage?.rotation || 0),
        position: { x: Number(primaryImage?.xPercent || 50), y: Number(primaryImage?.yPercent || 50) },
        side: primaryImage?.side || side,
      },
      // New fields for full state
      textLayers,
      imageLayers,
      background: undefined,
    };
  };

  const saveCustomizationServer = async () => {
    try {
      if (!selectedModel?._id) {
        toast.error('Modèle introuvable. Choisissez un produit.');
        return;
      }
      const payload = await buildServerPayload();
      const res = await customizationsAPI.saveCustomization(payload);
      const serverId = res?.data?.data?.id || res?.data?.data?._id || res?.data?.data?.customization?._id;
      if (!serverId) {
        toast.error("Réponse inattendue du serveur. L’ID est manquant.");
        return;
      }
      const name = (savedName && savedName.trim()) ? savedName.trim() : `Création ${new Date().toLocaleString()}`;
      const entry = { id: 'srv_' + serverId, name, timestamp: Date.now(), data: serializeCustomization(), serverId };
      setSavedList(prev => {
        const merged = [entry, ...prev].slice(0, 20);
        try { localStorage.setItem('cw_customizations', JSON.stringify(merged)); } catch(_) {}
        return merged;
      });
      const link = `${window.location.origin}${window.location.pathname}?custom=${serverId}`;
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(link); } catch (_) {}
      }
      toast.success('Création enregistrée en ligne. Lien copié dans le presse-papiers.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la sauvegarde en ligne';
      console.error('[saveCustomizationServer] error', err);
      toast.error(msg);
    }
  };

  const loadCustomizationServerById = async (id) => {
    try {
      const cleanId = (id || '').trim();
      if (!cleanId) { toast.error('ID de sauvegarde requis.'); return; }
      const res = await customizationsAPI.getCustomization(cleanId);
      const doc = res?.data?.data;
      if (!doc) { toast.error('Personnalisation introuvable.'); return; }
      const text = doc.text || null;
      const image = doc.image || null;
      const colorHex = doc.productColor || '#ffffff';
      const colorName = Object.entries(COLOR_NAME_TO_HEX).find(([name, hex]) => String(hex).toLowerCase() === String(colorHex).toLowerCase())?.[0] || selectedColor;
      setSelectedColor(colorName);
      if (text) {
        const newText = {
          id: 'srv_text_' + Date.now(),
          content: text.content || '',
          fontFamily: text.font || 'Arial',
          fontSize: Number(text.fontSize || 24),
          color: text.color || '#000000',
          rotation: Number(text.rotation || 0),
          align: text.align || 'center',
          xPercent: Number(text.position?.x || 50),
          yPercent: Number(text.position?.y || 50),
          side: text.side || 'front',
          zIndex: 3,
          visible: true,
        };
        setTextLayers(prev => [newText, ...prev]);
        setShowBack((text.side || 'front') === 'back');
      }
      if (image) {
        const newImage = createImageLayer(image.dataUrl, {
            scale: Number((image.size || 100) / 100),
            rotation: Number(image.rotation || 0),
            xPercent: Number(image.position?.x || 50),
            yPercent: Number(image.position?.y || 50),
            side: image.side || (showBack ? 'back' : 'front'),
        });
        setImageLayers(prev => [...prev, newImage]);
        setShowBack((image.side || 'front') === 'back');
      }
      toast.success('Création chargée depuis le serveur.');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors du chargement en ligne';
      console.error('[loadCustomizationServerById] error', err);
      toast.error(msg);
    }
  };

  const saveCustomizationLocal = () => {
    try {
      const data = serializeCustomization();
      // Sauvegarde simple pour compatibilité
      localStorage.setItem('cw_customization', JSON.stringify(data));
      // Sauvegarde avancée : liste nommée persistante (max 20)
      const id = 'sv_' + Date.now();
      const name = (savedName && savedName.trim()) ? savedName.trim() : `Création ${new Date().toLocaleString()}`;
      const next = { id, name, timestamp: Date.now(), data };
      setSavedList(prev => {
        const merged = [next, ...prev].slice(0, 20);
        try { localStorage.setItem('cw_customizations', JSON.stringify(merged)); } catch(_) {}
        return merged;
      });
      toast.success('Création sauvegardée dans vos sauvegardes.');
    } catch(e) { console.error('Save error', e); toast.error('Erreur lors de la sauvegarde.'); }
  };
  const loadCustomizationLocal = () => {
    try {
      const raw = localStorage.getItem('cw_customization');
      if (!raw) { toast.info('Aucune sauvegarde trouvée.'); return; }
      const data = JSON.parse(raw);
      setTextLayers(data.textLayers || []);
      setGuideLines(data.guideLines || []);
      if (typeof data.showBack === 'boolean') setShowBack(data.showBack);
      if (data.rulerUnit) setRulerUnit(data.rulerUnit);
      if (data.selectedColor) setSelectedColor(data.selectedColor);
      if (Array.isArray(data.imageLayers)) {
        setImageLayers(data.imageLayers);
        setSelectedImageId(data.selectedImageId || null);
      } else if (typeof data.uploadedImageUrl === 'string') {
        const newImage = createImageLayer(data.uploadedImageUrl, {
            xPercent: data.imageXPercent ?? 50,
            yPercent: data.imageYPercent ?? 50,
            scale: data.imageScale ?? 1,
            rotation: data.imageRotation ?? 0,
            visible: data.imageVisible ?? true,
            locked: data.imageLocked ?? false,
            opacity: data.imageOpacity ?? 1,
            flipX: data.imageFlipX ?? false,
            zIndex: data.imageZIndex ?? 2,
            side: data.imageSide ?? 'front'
        });
        setImageLayers([newImage]);
        setSelectedImageId(newImage.id);
      } else {
        setImageLayers([]);
        setSelectedImageId(null);
      }
      setSelectedTextId(null);
      setEditingTextId(null);
      toast.success('Création chargée.');
    } catch(e) { console.error('Load error', e); toast.error('Erreur lors du chargement.'); }
  };
  const loadSavedById = (id) => {
    const found = savedList.find(s => s.id === id);
    if (!found) { toast.error('Sauvegarde introuvable.'); return; }
    const data = found.data || {};
    try {
      setTextLayers(data.textLayers || []);
      setGuideLines(data.guideLines || []);
      if (typeof data.showBack === 'boolean') setShowBack(data.showBack);
      if (data.rulerUnit) setRulerUnit(data.rulerUnit);
      if (data.selectedColor) setSelectedColor(data.selectedColor);
      
      if (Array.isArray(data.imageLayers)) {
        setImageLayers(data.imageLayers);
        setSelectedImageId(data.selectedImageId || null);
      } else if (typeof data.uploadedImageUrl === 'string' && data.uploadedImageUrl) {
        // Legacy support
        const newImage = createImageLayer(data.uploadedImageUrl, {
            xPercent: data.imageXPercent ?? 50,
            yPercent: data.imageYPercent ?? 50,
            scale: data.imageScale ?? 1,
            rotation: data.imageRotation ?? 0,
            visible: data.imageVisible ?? true,
            locked: data.imageLocked ?? false,
            opacity: data.imageOpacity ?? 1,
            flipX: data.imageFlipX ?? false,
            zIndex: data.imageZIndex ?? 2,
            side: data.imageSide ?? 'front'
        });
        setImageLayers([newImage]);
        setSelectedImageId(newImage.id);
      } else {
        setImageLayers([]);
        setSelectedImageId(null);
      }

      setSelectedTextId(null);
      setEditingTextId(null);
      toast.success(`Sauvegarde "${found.name}" chargée.`);
    } catch(e) { console.error('Load saved error', e); toast.error('Erreur lors du chargement de la sauvegarde.'); }
  };
  const deleteSavedById = (id) => {
    setSavedList(prev => {
      const next = prev.filter(s => s.id !== id);
      try { localStorage.setItem('cw_customizations', JSON.stringify(next)); } catch(_) {}
      return next;
    });
    toast.success('Sauvegarde supprimée.');
  };
  const renameSavedById = (id, name) => {
    const newName = (name || '').trim();
    if (!newName) { toast.error('Nom invalide.'); return; }
    setSavedList(prev => {
      const next = prev.map(s => s.id === id ? { ...s, name: newName } : s);
      try { localStorage.setItem('cw_customizations', JSON.stringify(next)); } catch(_) {}
      return next;
    });
    toast.success('Sauvegarde renommée.');
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
    // Auto-save customization to local storage
    try { localStorage.setItem('cw_auto_customization', JSON.stringify(serializeCustomization())); } catch(e) {}
    setHasAutoDraft(true);
  }, [
    textLayers,
    guideLines,
    rulerUnit,
    selectedColor,
    showBack,
    imageLayers,
    selectedImageId,
  ]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c');
    if (c) {
      try {
        const data = JSON.parse(decodeURIComponent(atob(c)));
        setTextLayers(data.textLayers || []);
        setGuideLines(data.guideLines || []);
        if (typeof data.showBack === 'boolean') setShowBack(data.showBack);
        if (data.rulerUnit) setRulerUnit(data.rulerUnit);
        if (data.selectedColor) setSelectedColor(data.selectedColor);
        
        if (Array.isArray(data.imageLayers)) {
          setImageLayers(data.imageLayers);
          setSelectedImageId(data.selectedImageId || null);
        } else if (typeof data.uploadedImageUrl === 'string') {
          const newImage = createImageLayer(data.uploadedImageUrl, {
              xPercent: data.imageXPercent ?? 50,
              yPercent: data.imageYPercent ?? 50,
              scale: data.imageScale ?? 1,
              rotation: data.imageRotation ?? 0,
              visible: data.imageVisible ?? true,
              locked: data.imageLocked ?? false,
              opacity: data.imageOpacity ?? 1,
              flipX: data.imageFlipX ?? false,
              zIndex: data.imageZIndex ?? 2,
              side: data.imageSide ?? 'front'
          });
          setImageLayers([newImage]);
          setSelectedImageId(newImage.id);
        } else {
          setImageLayers([]);
          setSelectedImageId(null);
        }
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
    const size = Number(previewSize) || 2048;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const loadImg = (src) => new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin='anonymous'; img.onload=()=>resolve(img); img.onerror=reject; img.src=src; });
    try {
      const baseImg = await loadImg(baseSrc);
      ctx.drawImage(baseImg, 0, 0, size, size);

      // Construire les calques visibles (image + textes), triés par z-index
      const layers = [];
      
      const visibleImages = imageLayers.filter(img => (showBack ? img.side === 'back' : img.side === 'front') && (img.visible ?? true));
      for (const img of visibleImages) {
        layers.push({ type: 'image', zIndex: img.zIndex ?? 2, data: img });
      }

      const visibleTexts = textLayers.filter(t => (showBack ? t.side==='back' : t.side==='front') && (t.visible ?? true));
      for (const t of visibleTexts) {
        layers.push({ type: 'text', zIndex: t.zIndex || 3, data: t });
      }
      layers.sort((a,b)=> (a.zIndex||0) - (b.zIndex||0));

      for (const layer of layers) {
        if (layer.type === 'image') {
          const imgData = layer.data;
          const upImg = await loadImg(imgData.url);
          const w = size * 0.5;
          const h = upImg.height * (w / upImg.width);
          const x = (imgData.xPercent/100)*size; const y = (imgData.yPercent/100)*size;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((imgData.rotation||0) * Math.PI/180);
          ctx.scale((imgData.flipX ? -1 : 1) * (imgData.scale||1), imgData.scale||1);
          ctx.globalAlpha = imgData.opacity ?? 1;
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
            
            ctx.save();
            if (t.borderStyle === 'dashed') {
              ctx.setLineDash([8, 6]);
            } else if (t.borderStyle === 'double') {
              // Simple double border simulation by drawing twice if width > 2
              // But standard strokeRect doesn't support double. 
              // We'll just ignore double for now or treat as solid, or maybe dashed is enough.
              // Let's just stick to dashed/solid support for now to keep it simple and robust.
            }
            ctx.strokeRect(-metricsW/2 - pad, -metricsH/2 - pad, metricsW + pad*2, metricsH + pad*2);
            ctx.restore();
          }

          if (t.strokeEnabled) {
            ctx.lineWidth = t.strokeWidth || 1;
            ctx.strokeStyle = t.strokeColor || '#000000';
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(text, 0, 0);
          }

          ctx.fillStyle = t.color || '#111827';
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
      // Repères utilisateur
      const userGuides = includeGuides ? guideLines.filter(g => (showBack ? g.side==='back' : g.side==='front')) : [];
      if (userGuides.length) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        for (const g of userGuides) {
          if (g.type === 'vertical') {
            const x = (g.percent/100) * size;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, size);
            ctx.stroke();
          } else {
            const y = (g.percent/100) * size;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(size, y);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
      const data = canvas.toDataURL('image/png');
      const safeName = (savedName && savedName.trim()) ? savedName.trim().toLowerCase().replace(/\s+/g,'-') : 'creation';
      const a = document.createElement('a'); a.href = data; a.download = `customwear-${safeName}-${size}px.png`; a.click();
      toast.success('Aperçu téléchargé.');
    } catch(e) { console.error('Preview download error', e); toast.error("Erreur lors du téléchargement de l'aperçu."); }
  };

  const exportCustomizationFile = () => {
    try {
      const data = serializeCustomization();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const safeName = (savedName && savedName.trim()) ? savedName.trim().toLowerCase().replace(/\s+/g,'-') : 'creation';
      const a = document.createElement('a'); a.href = url; a.download = `customwear-${safeName}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Fichier exporté.');
    } catch(e) { console.error('Export error', e); toast.error("Erreur lors de l'export."); }
  };
  const importCustomizationFile = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      setTextLayers(data.textLayers || []);
      setGuideLines(data.guideLines || []);
      if (typeof data.showBack === 'boolean') setShowBack(data.showBack);
      if (data.rulerUnit) setRulerUnit(data.rulerUnit);
      if (data.selectedColor) setSelectedColor(data.selectedColor);
      
      if (Array.isArray(data.imageLayers)) {
        setImageLayers(data.imageLayers);
        setSelectedImageId(data.selectedImageId || null);
      } else if (typeof data.uploadedImageUrl === 'string') {
        const newImage = createImageLayer(data.uploadedImageUrl, {
            xPercent: data.imageXPercent ?? 50,
            yPercent: data.imageYPercent ?? 50,
            scale: data.imageScale ?? 1,
            rotation: data.imageRotation ?? 0,
            visible: data.imageVisible ?? true,
            locked: data.imageLocked ?? false,
            opacity: data.imageOpacity ?? 1,
            flipX: data.imageFlipX ?? false,
            zIndex: data.imageZIndex ?? 2,
            side: data.imageSide ?? 'front'
        });
        setImageLayers([newImage]);
        setSelectedImageId(newImage.id);
      } else {
        setImageLayers([]);
        setSelectedImageId(null);
      }

      setSelectedTextId(null);
      setEditingTextId(null);
      toast.success('Création importée.');
    } catch(e) { console.error('Import error', e); toast.error('Fichier invalide ou import impossible.'); }
  };
  const loadAutoDraft = () => {
    try {
      const raw = localStorage.getItem('cw_auto_customization');
      if (!raw) { toast.info('Aucun brouillon auto.'); return; }
      const data = JSON.parse(raw);
      setTextLayers(data.textLayers || []);
      setGuideLines(data.guideLines || []);
      if (typeof data.showBack === 'boolean') setShowBack(data.showBack);
      if (data.rulerUnit) setRulerUnit(data.rulerUnit);
      if (data.selectedColor) setSelectedColor(data.selectedColor);
      
      if (Array.isArray(data.imageLayers)) {
        setImageLayers(data.imageLayers);
        setSelectedImageId(data.selectedImageId || null);
      } else if (typeof data.uploadedImageUrl === 'string') {
        const newImage = createImageLayer(data.uploadedImageUrl, {
            xPercent: data.imageXPercent ?? 50,
            yPercent: data.imageYPercent ?? 50,
            scale: data.imageScale ?? 1,
            rotation: data.imageRotation ?? 0,
            visible: data.imageVisible ?? true,
            locked: data.imageLocked ?? false,
            opacity: data.imageOpacity ?? 1,
            flipX: data.imageFlipX ?? false,
            zIndex: data.imageZIndex ?? 2,
            side: data.imageSide ?? 'front'
        });
        setImageLayers([newImage]);
        setSelectedImageId(newImage.id);
      } else {
        setImageLayers([]);
        setSelectedImageId(null);
      }

      setSelectedTextId(null);
      setEditingTextId(null);
      toast.success('Brouillon repris.');
    } catch(e) { console.error('Auto draft load error', e); toast.error('Impossible de reprendre le brouillon.'); }
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
    if (selectedImageId) {
        const img = imageLayers.find(i => i.id === selectedImageId);
        if (img) {
            updateImageLayer(selectedImageId, { xPercent: Math.min((img.xPercent || 50) + 5, 98) });
        }
    }
  };

  const alignImageRight = () => {
    if (selectedImageId) {
        updateImageLayer(selectedImageId, { xPercent: 92 });
    }
  };

  // Révoquer l'URL blob uniquement au démontage pour éviter de casser les images lors des mises à jour d'état
  const imageLayersRef = useRef(imageLayers);
  imageLayersRef.current = imageLayers;

  useEffect(() => {
    return () => {
      // Nettoyage final lors du démontage du composant
      if (Array.isArray(imageLayersRef.current)) {
        imageLayersRef.current.forEach(img => {
          if (img.url && img.url.startsWith('blob:')) {
              try { URL.revokeObjectURL(img.url); } catch (e) {}
          }
        });
      }
    };
  }, []);

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

  useEffect(() => {
    const modelId = query.get('model');
    const colorParam = query.get('color');
    if (!modelId || activeModels.length === 0) return;
    const next = activeModels.find(m => String(m._id) === String(modelId));
    if (next) {
      if (next._id !== selectedModel?._id || colorParam) {
        setSelectedModel(next);
        let targetColor = null;
        if (colorParam && Array.isArray(next.colors)) {
          targetColor = next.colors.find(c => String(c).toLowerCase() === String(colorParam).toLowerCase());
        }
        if (targetColor) {
          setSelectedColor(targetColor);
        } else if (Array.isArray(next.colors) && next.colors.length) {
          if (next._id !== selectedModel?._id) {
            setSelectedColor(next.colors[0]);
          }
        }
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
    const url = URL.createObjectURL(file);
    
    // Get aspect ratio
    const img = new Image();
    img.onload = () => {
        const aspect = img.width / img.height;
        addImageLayer(url, { aspect });
    };
    img.src = url;
  };

  // Supprimer le fond de l'image uploadée (client-side)
  const [bgRemoving, setBgRemoving] = useState(false);
  const handleRemoveBackground = async () => {
    const selectedImage = imageLayers.find(img => img.id === selectedImageId);
    if (!selectedImage) {
      toast.error("Veuillez sélectionner une image d’abord.");
      return;
    }
    const currentUrl = selectedImage.url;
    try {
      setBgRemoving(true);
      const blob = await fetch(currentUrl).then(r => r.blob());
      if (blob && blob.type === 'image/svg+xml') {
        toast.error('La suppression de fond ne supporte pas les images SVG.');
        setBgRemoving(false);
        return;
      }
      const { removeBackground } = await import('@imgly/background-removal');
      const resultBlob = await removeBackground(blob, { model: 'medium' });
      const nextUrl = URL.createObjectURL(resultBlob);
      
      if (currentUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(currentUrl); } catch (e) {}
      }
      updateImageLayer(selectedImageId, { url: nextUrl });
      toast.success('Fond supprimé avec succès !');
    } catch (err) {
      console.error('[Customize] removeBackground error', err);
      toast.error('Échec de la suppression du fond.');
    } finally {
      setBgRemoving(false);
    }
  };

  // --- Crop Logic ---
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);

  const startCrop = () => {
    const img = imageLayers.find(i => i.id === selectedImageId);
    if (img) {
      setImageToCrop(img.url);
      setCropModalOpen(true);
    }
  };

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, undefined));
  }

  const applyCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    try {
        const image = imgRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const offscreen = document.createElement('canvas');
        offscreen.width = completedCrop.width * scaleX;
        offscreen.height = completedCrop.height * scaleY;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            offscreen.width,
            offscreen.height,
        );
        
        const blob = await new Promise(resolve => offscreen.toBlob(resolve, 'image/png'));
        const newUrl = URL.createObjectURL(blob);
        
        // Revoke old if blob
        const oldUrl = imageLayers.find(i => i.id === selectedImageId)?.url;
        if (oldUrl && oldUrl.startsWith('blob:') && oldUrl !== imageToCrop) {
             try { URL.revokeObjectURL(oldUrl); } catch(e) {}
        }
        
        updateImageLayer(selectedImageId, { url: newUrl });
        setCropModalOpen(false);
        setImageToCrop(null);
        toast.success('Image recadrée');
    } catch(e) {
        console.error(e);
        toast.error('Erreur lors du recadrage');
    }
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
      <div className="assistant-compact">
        <form onSubmit={handleAskAssistant} className="assistant-compact-form">
          <input
            type="text"
            className="assistant-compact-input"
            placeholder="Besoin d’un conseil sur ta personnalisation ?"
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
      <nav className="flex items-center space-x-1 border-b pb-2 mb-4 overflow-x-auto md:overflow-visible" aria-label="Sous-navigation">
        <NavLink to="/customize" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap", isActive ? "bg-blue-600 text-white font-bold" : "text-white-600 hover:bg-blue-700 hover:text-white")}>Personnalisation</NavLink>
        <NavLink to="/products" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap", isActive ? "bg-blue-100 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}>Produits disponibles</NavLink>
        <NavLink to="/models" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap", isActive ? "bg-blue-100 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}>Modèles</NavLink>
      </nav>

      {/* Barre de menus au-dessus des panneaux (Desktop) / En bas (Mobile) */} 
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white border-t p-2 md:relative md:bottom-auto md:border-t-2 md:border-b-2 md:border-gray-300 md:bg-white md:p-2 md:mb-4 md:justify-start md:gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none" role="navigation" aria-label="Barre de menus"> 
        <Button 
          variant={activeContextSection === 'produit' ? 'default' : 'ghost'} 
          size="sm" 
          className={cn("flex-1 lg:flex-none", activeContextSection === 'produit' ? "font-bold" : "")} 
          onClick={() => { setActiveContextSection('produit'); setContextOpen(true); scrollToSection('produit'); }} 
          aria-pressed={activeContextSection === 'produit'} 
        > 
          <FiFilter className="w-4 h-4 mr-2" /> Modèles 
        </Button> 
        <Button 
          variant={activeContextSection === 'image' ? 'default' : 'ghost'} 
          size="sm" 
          className={cn("flex-1 lg:flex-none", activeContextSection === 'image' ? "font-bold" : "")} 
          onClick={() => { setActiveContextSection('image'); setContextOpen(true); scrollToSection('image'); }} 
          aria-pressed={activeContextSection === 'image'} 
        > 
          <FiImage className="w-4 h-4 mr-2" /> Image 
        </Button> 
        <Button 
          variant={activeContextSection === 'texte' ? 'default' : 'ghost'} 
          size="sm" 
          className={cn("flex-1 lg:flex-none", activeContextSection === 'texte' ? "font-bold" : "")} 
          onClick={() => { setActiveContextSection('texte'); setContextOpen(true); scrollToSection('texte'); }} 
          aria-pressed={activeContextSection === 'texte'} 
        > 
          <FiType className="w-4 h-4 mr-2" /> Texte 
        </Button> 
        <Button 
          variant={activeContextSection === 'save' ? 'default' : 'ghost'} 
          size="sm" 
          className={cn("flex-1 lg:flex-none", activeContextSection === 'save' ? "font-bold" : "")} 
          onClick={() => { setActiveContextSection('save'); setContextOpen(true); scrollToSection('save'); }} 
          aria-pressed={activeContextSection === 'save'} 
        > 
          <FiSave className="w-4 h-4 mr-2" /> Sauver 
        </Button> 
      </div>

      <div className={cn("customize-content pb-20 lg:pb-0")}>
        {/* Overlay mobile pour fermer en cliquant dehors */}
        {contextOpen && activeContextSection && (
          <div 
            className="fixed inset-0 z-30 lg:hidden" 
            onClick={() => { setContextOpen(false); setActiveContextSection(null); }}
            aria-hidden="true"
          />
        )}
        {/* Panneau gauche: choix modèle et infos */}
        <div className={cn(
          "customize-tools transition-all duration-300",
          contextOpen && activeContextSection ? "fixed bottom-[60px] left-0 right-0 z-40 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] rounded-t-xl h-[50vh] overflow-y-auto p-4 md:static md:h-auto md:bg-transparent md:border-none md:shadow-none md:p-0 md:z-auto" : "hidden md:block"
        )}>
          {/* En-tête mobile pour la fenêtre */}
          <div className="w-full flex md:hidden items-center mb-4 sticky top-0 bg-white z-10 pb-2">
            <h3 className="font-bold text-lg uppercase flex-1">{{
              produit: 'Modèles',
              image: 'Image',
              texte: 'Texte',
              save: 'Sauvegarder'
            }[activeContextSection] || activeContextSection}</h3>
            {/* <Button variant="ghost" size="sm" onClick={() => { setContextOpen(false); setActiveContextSection(null); }}>Fermer</Button> */}
          </div>
          <div className="container-panel">
          {activeContextSection === 'produit' && (
          <div
            ref={produitRef}
            className="panel open"
            role="region"
            aria-label="Filtrer les modèles"
          >
            {/* <div className="panel-header">
              <h3>Filtre les modèles</h3>
              <span className="panel-arrow" aria-hidden="true"></span>
            </div> */}
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
          )}


          {activeContextSection === 'image' && (
          <div
            ref={imageRef}
            className="panel open"
            role="region"
            aria-label="Ajouter une image"
          >
            {/* <div className="panel-header">
              <h3>Ajouter une image</h3>
              <span className="panel-arrow" aria-hidden="true"></span>
            </div> */}
            <div className="panel-content" onClick={(e) => e.stopPropagation()}>
              <div className="form-group">
                <label
                  role="button"
                  tabIndex={0}
                  onClick={() => setImageUploaderOpen(o => !o)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setImageUploaderOpen(o => !o); }}
                  style={{ cursor: 'pointer', width: 'auto', border: '1px solid #3b82f6', padding: 8, borderRadius: 4, backgroundColor: imageUploaderOpen ? '#3b82f6' : 'rgba(232, 232, 232, 0.73)', color: imageUploaderOpen ? '#ffffff' : undefined }}
                >
                  Uploader une image (PNG/JPG/SVG)
                </label>
                {imageUploaderOpen && (
                  <>
                    <input type="file" accept="image/*,.svg" onChange={handleFileUpload} />
                    <div className="quick-actions" style={{ marginTop: 8 }}>
                      <button className="chip" onClick={nudgeImageRight} disabled={!selectedImageId}>Déplacer à droite</button>
                      <button className="chip" onClick={alignImageRight} disabled={!selectedImageId}>Aligner à droite</button>
                      <button className="chip" disabled={!selectedImageId || bgRemoving} onClick={handleRemoveBackground}>
                        {bgRemoving ? 'Suppression du fond…' : 'Supprimer le fond'}
                      </button>
                      <button className="chip" onClick={() => {
                        if (selectedImageId) deleteImageLayer(selectedImageId);
                      }} disabled={!selectedImageId}>Supprimer</button>
                    </div>
                  </>
                )}
              </div>
              
              {selectedImageId && imageLayers.find(i => i.id === selectedImageId) ? (
                <>
                  <div className="form-group">
                    <label
                      role="button"
                      tabIndex={0}
                      onClick={() => setImageSizeOpen(o => !o)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setImageSizeOpen(o => !o); }}
                      style={{ cursor: 'pointer', width: 'auto', border: '1px solid #3b82f6', padding: 8, borderRadius: 4 , backgroundColor: imageSizeOpen ? '#3b82f6' : 'rgba(232, 232, 232, 0.73)', color: imageSizeOpen ? '#ffffff' : undefined  }}
                    >Taille</label>
                    {imageSizeOpen && (
                      <input 
                        type="range" min="0.2" max="3" step="0.05" 
                        value={imageLayers.find(i => i.id === selectedImageId).scale || 1} 
                        onChange={(e) => updateImageLayer(selectedImageId, { scale: Number(e.target.value) })} 
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label
                      role="button"
                      tabIndex={0}
                      onClick={() => setImageRotationOpen(o => !o)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setImageRotationOpen(o => !o); }}
                      style={{ cursor: 'pointer', width: 'auto', border: '1px solid #3b82f6', padding: 8, borderRadius: 4 , backgroundColor: imageRotationOpen ? '#3b82f6' : 'rgba(232, 232, 232, 0.73)', color: imageRotationOpen ? '#ffffff' : undefined }}
                    >Rotation</label>
                    {imageRotationOpen && (
                      <input 
                        type="range" min="-180" max="180" step="1" 
                        value={imageLayers.find(i => i.id === selectedImageId).rotation || 0} 
                        onChange={(e) => updateImageLayer(selectedImageId, { rotation: Number(e.target.value) })} 
                      />
                    )}
                  </div>
                  {/* Nouveaux contrôles avancés */}
                  <div className="form-group">
                    <label
                      role="button"
                      tabIndex={0}
                      onClick={() => setImageVisibilityOpen(o => !o)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setImageVisibilityOpen(o => !o); }}
                      style={{ cursor: 'pointer', width: 'auto', border: '1px solid #3b82f6', padding: 8, borderRadius: 4 , backgroundColor: imageVisibilityOpen ? '#3b82f6' : 'rgba(232, 232, 232, 0.73)', color: imageVisibilityOpen ? '#ffffff' : undefined  }}
                    >Options</label>
                    {imageVisibilityOpen && (
                      <div className="options-row">
                        <label className="chip">
                          <input 
                            type="checkbox" 
                            checked={imageLayers.find(i => i.id === selectedImageId).visible ?? true} 
                            onChange={() => updateImageLayer(selectedImageId, { visible: !(imageLayers.find(i => i.id === selectedImageId).visible ?? true) })} 
                          /> Visible
                        </label>
                        <button 
                          type="button" 
                          className={`chip ${imageLayers.find(i => i.id === selectedImageId).locked ? 'active' : ''}`} 
                          onClick={() => updateImageLayer(selectedImageId, { locked: !imageLayers.find(i => i.id === selectedImageId).locked })}
                        >
                          {imageLayers.find(i => i.id === selectedImageId).locked ? 'Déverrouiller' : 'Verrouiller'}
                        </button>
                        <button 
                          type="button" 
                          className="chip" 
                          onClick={() => updateImageLayer(selectedImageId, { side: imageLayers.find(i => i.id === selectedImageId).side === 'front' ? 'back' : 'front' })}
                        >
                          {imageLayers.find(i => i.id === selectedImageId).side === 'front' ? 'Envoyer à arrière' : 'Envoyer à avant'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label
                      role="button"
                      tabIndex={0}
                      onClick={() => setImageOpacityOpen(o => !o)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setImageOpacityOpen(o => !o); }}
                      style={{ cursor: 'pointer', width: 'auto', border: '1px solid #3b82f6', padding: 8, borderRadius: 4 , backgroundColor: imageOpacityOpen ? '#3b82f6' : 'rgba(232, 232, 232, 0.73)', color: imageOpacityOpen ? '#ffffff' : undefined }}
                    >Opacité</label>
                    {imageOpacityOpen && (
                      <input 
                        type="range" min="0" max="1" step="0.05" 
                        value={imageLayers.find(i => i.id === selectedImageId).opacity ?? 1} 
                        onChange={(e) => updateImageLayer(selectedImageId, { opacity: Number(e.target.value) })} 
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label
                      role="button"
                      tabIndex={0}
                      onClick={() => setImagePositionOpen(o => !o)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setImagePositionOpen(o => !o); }}
                      style={{ cursor: 'pointer', width: 'auto', border: '1px solid #3b82f6', padding: 8, borderRadius: 4 , backgroundColor: imagePositionOpen ? '#3b82f6' : 'rgba(232, 232, 232, 0.73)', color: imagePositionOpen ? '#ffffff' : undefined  }}
                    >Position</label>
                    {imagePositionOpen && (
                      <>
                        <div className="options-row">
                          <button type="button" className="chip" onClick={() => {
                            const img = imageLayers.find(i => i.id === selectedImageId);
                            if (img) updateImageLayer(selectedImageId, { xPercent: Math.max(5, (img.xPercent || 50) - 5) });
                          }}>←</button>
                          <button type="button" className="chip" onClick={() => {
                            const img = imageLayers.find(i => i.id === selectedImageId);
                            if (img) updateImageLayer(selectedImageId, { xPercent: Math.min(95, (img.xPercent || 50) + 5) });
                          }}>→</button>
                          <button type="button" className="chip" onClick={() => {
                            const img = imageLayers.find(i => i.id === selectedImageId);
                            if (img) updateImageLayer(selectedImageId, { yPercent: Math.max(5, (img.yPercent || 50) - 5) });
                          }}>↑</button>
                          <button type="button" className="chip" onClick={() => {
                            const img = imageLayers.find(i => i.id === selectedImageId);
                            if (img) updateImageLayer(selectedImageId, { yPercent: Math.min(95, (img.yPercent || 50) + 5) });
                          }}>↓</button>
                          <button type="button" className="chip" onClick={() => updateImageLayer(selectedImageId, { xPercent: 50, yPercent: 50 })}>Centrer</button>
                        </div>
                        <div className="form-group" style={{ marginTop: 8 }}>
                          <div className="options-row">
                            <button type="button" className="chip" onClick={() => {
                               const img = imageLayers.find(i => i.id === selectedImageId);
                               if (img) updateImageLayer(selectedImageId, { flipX: !img.flipX });
                            }}>{(selectedImageId && imageLayers.find(i => i.id === selectedImageId)?.flipX) ? 'Annuler flip horizontal' : 'Flip horizontal'}</button>
                            <button type="button" className="chip" onClick={() => {
                               const img = imageLayers.find(i => i.id === selectedImageId);
                               if (img) updateImageLayer(selectedImageId, { zIndex: Math.max(1, (img.zIndex || 2) - 1) });
                            }}>Arrière-plan</button>
                            <button type="button" className="chip" onClick={() => {
                               const img = imageLayers.find(i => i.id === selectedImageId);
                               if (img) updateImageLayer(selectedImageId, { zIndex: Math.min(10, (img.zIndex || 2) + 1) });
                            }}>Premier plan</button>
                          </div>
                          <small style={{ color:'#6b7280' }}>
                            z-index: {selectedImageId && imageLayers.find(i => i.id === selectedImageId)?.zIndex} • face: {selectedImageId && imageLayers.find(i => i.id === selectedImageId)?.side}
                          </small>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="options-row">
                      <button type="button" className="chip" onClick={startCrop}>Rogner</button>
                      <button type="button" className="chip" onClick={() => {
                        if (selectedImageId) updateImageLayer(selectedImageId, { xPercent: 50, yPercent: 50, scale: 1, rotation: 0, opacity: 1, flipX: false, zIndex: 2, side: 'front' });
                      }}>Réinitialiser</button>
                      <button type="button" className="chip" onClick={() => {
                         if (selectedImageId) {
                           const img = imageLayers.find(i => i.id === selectedImageId);
                           if (img && img.url && img.url.startsWith('blob:')) {
                             try { URL.revokeObjectURL(img.url); } catch(e) {}
                           }
                           deleteImageLayer(selectedImageId);
                         }
                      }}>Supprimer l'image</button>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ padding: 8, color: '#666', fontStyle: 'italic' }}>Sélectionnez une image pour voir les options.</p>
              )}
            </div>
          </div>
          )}

          {activeContextSection === 'texte' && (
          <div
            ref={texteRef}
            className="panel open"
            role="region"
            aria-label="Ajouter un texte"
          >
            {/* <div className="panel-header">
              <h3>Ajouter un texte</h3>
              <span className="panel-arrow" aria-hidden="true"></span>
            </div> */}
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
                <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTextInspectorTab('content')}
                      className={`flex-1 px-3 py-2 text-xs font-medium border rounded ${
                        activeTextInspectorTab === 'content'
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Contenu du texte
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTextInspectorTab('effects')}
                      className={`flex-1 px-3 py-2 text-xs font-medium border rounded ${
                        activeTextInspectorTab === 'effects'
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Effets & Décorations
                    </button>
                  </div>

                  {activeTextInspectorTab === 'content' && (
                  <div className="flex flex-col gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Contenu du texte</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        maxLength={textCharLimit} 
                        value={textLayers.find(t=>t.id===selectedTextId)?.content || ''} 
                        onChange={(e)=>updateTextLayer(selectedTextId, { content: e.target.value })} 
                        placeholder="Votre texte ici"
                      />
                      <div className="flex justify-end mt-1">
                        <small className="text-xs text-gray-500">{ (textLayers.find(t=>t.id===selectedTextId)?.content?.length || 0) } / {textCharLimit}</small>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Police</label>
                        <select 
                          className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                          value={textLayers.find(t=>t.id===selectedTextId)?.fontFamily || 'Arial, Helvetica, sans-serif'} 
                          onChange={(e)=>updateTextLayer(selectedTextId, { fontFamily: e.target.value })}
                        >
                          <option value="Arial, Helvetica, sans-serif">Arial</option>
                          <option value="'Times New Roman', Times, serif">Times New Roman</option>
                          <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                          <option value="Montserrat, Arial, sans-serif">Montserrat</option>
                          <option value="Roboto, Arial, sans-serif">Roboto</option>
                          <option value="'Open Sans', Arial, sans-serif">Open Sans</option>
                          <option value="Courier New, monospace">Courier New</option>
                        </select>
                      </div>
                      <div>
                         <label className="text-xs font-medium text-gray-500 mb-1 block">Alignement</label>
                         <div className="flex border rounded overflow-hidden bg-white">
                            <button className="flex-1 py-1.5 hover:bg-gray-100 text-xs border-r" onClick={()=>alignTextHorizontal(selectedTextId,'left')}>G</button>
                            <button className="flex-1 py-1.5 hover:bg-gray-100 text-xs border-r" onClick={()=>alignTextHorizontal(selectedTextId,'center')}>C</button>
                            <button className="flex-1 py-1.5 hover:bg-gray-100 text-xs" onClick={()=>alignTextHorizontal(selectedTextId,'right')}>D</button>
                         </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                       <button 
                        className={`flex-1 py-1.5 text-xs border rounded transition-colors ${textLayers.find(t=>t.id===selectedTextId)?.fontWeight === 700 ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-50'}`} 
                        onClick={()=>updateTextLayer(selectedTextId, { fontWeight: (textLayers.find(t=>t.id===selectedTextId)?.fontWeight===700) ? 400 : 700 })}
                       >Gras</button>
                       <button 
                        className={`flex-1 py-1.5 text-xs border rounded transition-colors ${textLayers.find(t=>t.id===selectedTextId)?.fontStyle === 'italic' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-50'}`} 
                        onClick={()=>updateTextLayer(selectedTextId, { fontStyle: (textLayers.find(t=>t.id===selectedTextId)?.fontStyle==='italic') ? 'normal' : 'italic' })}
                       >Italique</button>
                       <button 
                        className={`flex-1 py-1.5 text-xs border rounded transition-colors ${textLayers.find(t=>t.id===selectedTextId)?.textDecoration === 'underline' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-50'}`} 
                        onClick={()=>updateTextLayer(selectedTextId, { textDecoration: (textLayers.find(t=>t.id===selectedTextId)?.textDecoration==='underline') ? 'none' : 'underline' })}
                       >Souligné</button>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200"></div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-1/3">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Couleur</label>
                        <div className="flex items-center gap-2">
                           <input 
                              type="color" 
                              className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
                              value={(() => {
                                const c = textLayers.find(t=>t.id===selectedTextId)?.color || '#111827';
                                if (c === 'transparent') return '#000000';
                                return toHexString(parseColor(c));
                              })()} 
                              onChange={(e)=>{
                                const current = textLayers.find(t=>t.id===selectedTextId)?.color || '#111827';
                                const parsedOld = parseColor(current);
                                const parsedNew = parseColor(e.target.value);
                                updateTextLayer(selectedTextId, { color: toRgbaString({ ...parsedNew, a: parsedOld.a }) });
                              }} 
                            />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block flex justify-between">
                          <span>Opacité</span>
                          <span>{Math.round((parseColor(textLayers.find(t=>t.id===selectedTextId)?.color || '#111827').a) * 100)}%</span>
                        </label>
                        <input 
                          type="range" 
                          min="0" max="1" step="0.01" 
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          value={(() => {
                            const c = textLayers.find(t=>t.id===selectedTextId)?.color || '#111827';
                            return parseColor(c).a;
                          })()} 
                          onChange={(e)=>{
                             const val = parseFloat(e.target.value);
                             const current = textLayers.find(t=>t.id===selectedTextId)?.color || '#111827';
                             const parsed = parseColor(current);
                             updateTextLayer(selectedTextId, { color: toRgbaString({ ...parsed, a: val }) });
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block flex justify-between">
                        <span>Taille</span>
                        <span>{textLayers.find(t=>t.id===selectedTextId)?.fontSize || 32}px</span>
                      </label>
                      <input 
                        type="range" min="8" max="200" step="1" 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        value={textLayers.find(t=>t.id===selectedTextId)?.fontSize || 32} 
                        onChange={(e)=>updateTextLayer(selectedTextId, { fontSize: Number(e.target.value) })} 
                      />
                    </div>
                  </div>

                  <div className="h-px bg-gray-200"></div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Esp. Lettres</label>
                      <input 
                        type="range" min="-2" max="10" step="0.5" 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        value={textLayers.find(t=>t.id===selectedTextId)?.letterSpacing || 0} 
                        onChange={(e)=>updateTextLayer(selectedTextId, { letterSpacing: Number(e.target.value) })} 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Hauteur Ligne</label>
                      <input 
                        type="range" min="0.8" max="2.5" step="0.05" 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        value={textLayers.find(t=>t.id===selectedTextId)?.lineHeight || 1.2} 
                        onChange={(e)=>updateTextLayer(selectedTextId, { lineHeight: Number(e.target.value) })} 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Rotation ({textLayers.find(t=>t.id===selectedTextId)?.rotation || 0}°)</label>
                      <input 
                        type="range" min="-180" max="180" step="1" 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        value={textLayers.find(t=>t.id===selectedTextId)?.rotation || 0} 
                        onChange={(e)=>updateTextLayer(selectedTextId, { rotation: Number(e.target.value) })} 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Échelle (x{textLayers.find(t=>t.id===selectedTextId)?.scale || 1})</label>
                      <input 
                        type="range" min="0.5" max="3" step="0.05" 
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        value={textLayers.find(t=>t.id===selectedTextId)?.scale || 1} 
                        onChange={(e)=>updateTextLayer(selectedTextId, { scale: Number(e.target.value) })} 
                      />
                    </div>
                  </div>

                  </div>
                  )}

                  {activeTextInspectorTab === 'effects' && (
                  <div className="space-y-4">
                    <div className="border rounded p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Arrière-plan</span>
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" checked={textLayers.find(t=>t.id===selectedTextId)?.backgroundEnabled || false} onChange={(e)=>updateTextLayer(selectedTextId, { backgroundEnabled: e.target.checked })} />
                      </div>
                      {textLayers.find(t=>t.id===selectedTextId)?.backgroundEnabled && (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div>
                            <label className="text-xs text-gray-500 block">Couleur</label>
                            <input type="color" className="w-full h-6 p-0 border-0 rounded" value={(() => {
                               const c = textLayers.find(t=>t.id===selectedTextId)?.backgroundColor || '#ffffff';
                               if (c === 'transparent') return '#ffffff';
                               return toHexString(parseColor(c));
                             })()} onChange={(e)=>{
                               const current = textLayers.find(t=>t.id===selectedTextId)?.backgroundColor || '#ffffff';
                               const parsedOld = parseColor(current);
                               const parsedNew = parseColor(e.target.value);
                               updateTextLayer(selectedTextId, { backgroundColor: toRgbaString({ ...parsedNew, a: parsedOld.a }) });
                             }} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block">Padding</label>
                            <input type="range" min="0" max="40" step="1" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={textLayers.find(t=>t.id===selectedTextId)?.padding || 4} onChange={(e)=>updateTextLayer(selectedTextId, { padding: Number(e.target.value) })} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border rounded p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Contour du texte</span>
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" checked={textLayers.find(t=>t.id===selectedTextId)?.strokeEnabled || false} onChange={(e)=>updateTextLayer(selectedTextId, { strokeEnabled: e.target.checked })} />
                      </div>
                      {textLayers.find(t=>t.id===selectedTextId)?.strokeEnabled && (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                           <div>
                            <label className="text-xs text-gray-500 block">Couleur</label>
                            <input type="color" className="w-full h-6 p-0 border-0 rounded" value={textLayers.find(t=>t.id===selectedTextId)?.strokeColor || '#000000'} onChange={(e)=>updateTextLayer(selectedTextId, { strokeColor: e.target.value })} />
                           </div>
                           <div>
                            <label className="text-xs text-gray-500 block">Épaisseur</label>
                            <input type="range" min="0" max="10" step="0.5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={textLayers.find(t=>t.id===selectedTextId)?.strokeWidth || 0} onChange={(e)=>updateTextLayer(selectedTextId, { strokeWidth: Number(e.target.value) })} />
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="border rounded p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Bordure (Cadre)</span>
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" checked={textLayers.find(t=>t.id===selectedTextId)?.borderEnabled || false} onChange={(e)=>updateTextLayer(selectedTextId, { borderEnabled: e.target.checked })} />
                      </div>
                      {textLayers.find(t=>t.id===selectedTextId)?.borderEnabled && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                           <div>
                            <label className="text-xs text-gray-500 block">Couleur</label>
                            <input type="color" className="w-full h-6 p-0 border-0 rounded" value={textLayers.find(t=>t.id===selectedTextId)?.borderColor || '#000000'} onChange={(e)=>updateTextLayer(selectedTextId, { borderColor: e.target.value })} />
                           </div>
                           <div>
                            <label className="text-xs text-gray-500 block">Épaisseur</label>
                            <input type="range" min="0" max="10" step="1" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={textLayers.find(t=>t.id===selectedTextId)?.borderWidth || 0} onChange={(e)=>updateTextLayer(selectedTextId, { borderWidth: Number(e.target.value) })} />
                           </div>
                           <div>
                            <label className="text-xs text-gray-500 block">Style</label>
                            <select className="w-full h-6 text-xs border rounded" value={textLayers.find(t=>t.id===selectedTextId)?.borderStyle || 'solid'} onChange={(e)=>updateTextLayer(selectedTextId, { borderStyle: e.target.value })}>
                              <option value="solid">Trait</option>
                              <option value="dashed">Pointillé</option>
                            </select>
                           </div>
                        </div>
                      )}
                    </div>

                     <div className="border rounded p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Ombre portée</span>
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black" checked={textLayers.find(t=>t.id===selectedTextId)?.shadowEnabled || false} onChange={(e)=>updateTextLayer(selectedTextId, { shadowEnabled: e.target.checked })} />
                      </div>
                      {textLayers.find(t=>t.id===selectedTextId)?.shadowEnabled && (
                        <div className="space-y-3 mt-2">
                           <div>
                            <label className="text-xs text-gray-500 block mb-1">Couleur</label>
                            <input type="color" className="w-full h-6 p-0 border-0 rounded" value={textLayers.find(t=>t.id===selectedTextId)?.shadowColor || 'rgba(0,0,0,0.3)'} onChange={(e)=>updateTextLayer(selectedTextId, { shadowColor: e.target.value })} />
                           </div>
                           <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-xs text-gray-500 block">X</label>
                                <input type="range" min="-50" max="50" step="1" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={textLayers.find(t=>t.id===selectedTextId)?.shadowX || 0} onChange={(e)=>updateTextLayer(selectedTextId, { shadowX: Number(e.target.value) })} />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block">Y</label>
                                <input type="range" min="-50" max="50" step="1" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={textLayers.find(t=>t.id===selectedTextId)?.shadowY || 0} onChange={(e)=>updateTextLayer(selectedTextId, { shadowY: Number(e.target.value) })} />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block">Flou</label>
                                <input type="range" min="0" max="50" step="1" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={textLayers.find(t=>t.id===selectedTextId)?.shadowBlur || 0} onChange={(e)=>updateTextLayer(selectedTextId, { shadowBlur: Number(e.target.value) })} />
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  </div>
              )}
            </div>
          </div>
          )}

          {activeContextSection === 'save' && (
            <Card className="panel">
              {/* <CardHeader>
              <CardTitle>Sauvegarde</CardTitle>
            </CardHeader> */}
            <CardContent>
            {hasAutoDraft && (
              <Alert className="mb-2">
                <span>Un brouillon automatique est disponible.</span>
                <Button variant="outline" onClick={loadAutoDraft}>Reprendre le brouillon</Button>
              </Alert>
            )}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nom de la sauvegarde"
                value={savedName}
                onChange={(e) => setSavedName(e.target.value)}
              />
              <Button variant="outline" onClick={exportCustomizationFile}>Exporter JSON</Button>
              <Button asChild>
                <label style={{ cursor: 'pointer' }}>
                  Importer JSON
                  <input type="file" accept="application/json" onChange={importCustomizationFile} style={{ display: 'none' }} />
                </label>
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Résolution d'aperçu</Label>
                <Select value={previewSize} onChange={(e)=>setPreviewSize(Number(e.target.value))}>
                  <option value={1024}>1024 px</option>
                  <option value={2048}>2048 px</option>
                  <option value={4096}>4096 px</option>
                </Select>
              </div>
              <Checkbox checked={includeGuides} onChange={(e)=>setIncludeGuides(e.target.checked)} label="Inclure les guides sur l'aperçu" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={saveCustomizationLocal}>Enregistrer la création</Button>
              <Button variant="outline" onClick={loadCustomizationLocal}>Charger la création</Button>
              <Button variant="outline" onClick={generateShareLink}>Copier lien de partage</Button>
              <Button variant="ghost" onClick={downloadPreviewImage}>Télécharger l'aperçu</Button>
            </div>
            <div className="mt-4 p-3 border rounded-md">
              <p className="text-sm font-medium mb-2">Sauvegarde en ligne</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveCustomizationServer}>Enregistrer sur le compte</Button>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="md:col-span-2">
                  <Input value={serverLoadId} onChange={(e)=>setServerLoadId(e.target.value)} placeholder="ID de la création (serveur)" />
                </div>
                <div>
                  <Button variant="outline" onClick={()=>loadCustomizationServerById(serverLoadId)}>Charger depuis ID</Button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Astuce: l’ID est copié après l’enregistrement — collez-le ici pour recharger.</p>
            </div>
            {savedList.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-500">Vos sauvegardes</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {savedList.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 py-2 border-b border-dashed border-gray-200">
                      <span className="flex-1">
                        {s.name}
                        <span className="ml-2 text-gray-400">({new Date(s.timestamp).toLocaleString()})</span>
                        {s.serverId && (
                          <span className="block text-xs text-blue-600">ID serveur: {s.serverId}</span>
                        )}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => loadSavedById(s.id)}>Charger</Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        const nn = window.prompt('Nouveau nom', s.name);
                        if (nn !== null) renameSavedById(s.id, nn);
                      }}>Renommer</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteSavedById(s.id)}>Supprimer</Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-3">
              <p className="text-sm text-gray-500">Historique des actions</p>
              <div className="mt-1 flex gap-2">
                <Button variant="outline" onClick={undo}>Annuler (Ctrl/Cmd+Z)</Button>
                <Button variant="outline" onClick={redo}>Rétablir (Ctrl/Cmd+Y)</Button>
              </div>
              <ul className="list-disc pl-5">
                {historyActions.slice(-10).map((h, i) => (
                  <li key={i} className="text-sm text-gray-500">{h}</li>
                ))}
              </ul>
            </div>
            </CardContent>
            </Card>
          )}

          </div>
        </div>

        {/* Zone d'aperçu */}
        <div className="customize-preview">
          <div className="preview-toolbar">
            <div className="preview-toolbar-row">
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
            <div className="preview-toolbar-row">
              <div className="unit-controls">
                <span>Unité des règles</span>
                <select value={rulerUnit} onChange={(e)=>setRulerUnit(e.target.value)}>
                  <option value="px">Pixels</option>
                  <option value="cm">Centimètres</option>
                </select>
                {!previewMode && (
                  <div className="guide-controls">
                    <button className="chip" onClick={()=>addGuideLine('vertical')}>Ajouter repère vertical</button>
                    <button className="chip" onClick={()=>addGuideLine('horizontal')}>Ajouter repère horizontal</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <PreviewCanvas
            showBack={showBack}
            selectedModel={selectedModel}
            selectedColor={selectedColor}
            imageLayers={imageLayers}
            selectedImageId={selectedImageId}
            setSelectedImageId={setSelectedImageId}
            updateImageLayer={updateImageLayer}
            canvasRef={canvasRef}
            textLayers={textLayers}
            selectedTextId={selectedTextId}
            setSelectedTextId={setSelectedTextId}
            updateTextLayer={updateTextLayer}
            editingTextId={editingTextId}
            setEditingTextId={setEditingTextId}
            previewMode={previewMode}
            canvasZoom={canvasZoom}
            rulerUnit={rulerUnit}
            guideLines={guideLines}
            updateGuideLine={updateGuideLine}
            deleteGuideLine={deleteGuideLine}
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
                front: Array.isArray(imageLayers) && imageLayers.some(i => i?.side === 'front' && (i?.visible ?? true)),
                back: Array.isArray(imageLayers) && imageLayers.some(i => i?.side === 'back' && (i?.visible ?? true)),
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
            {!selectedTechnique && (
              <p style={{ color: '#dc2626', marginTop: 8 }}>Choisissez une technique d'impression pour continuer.</p>
            )}
            <p style={{ color: '#6b7280' }}>Aperçu et coûts seront ajoutés ici.</p>
          </div>

          {/* <div ref={saveRef}> */}
          
          <div className="panel">
            <div className="customize-actions">
              <button
                className="add-to-cart-btn"
                onClick={handleAddToCartCustomized}
                title="Ajouter au panier"
                disabled={!selectedTechnique}
              >
                <FiShoppingCart /> Ajouter au panier
              </button>
              <button
                className="checkout-btn"
                onClick={handleCheckoutCustomized}
                title="Paiement"
                disabled={!selectedTechnique}
              >
                <FiCreditCard /> Paiement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de recadrage */}
      {cropModalOpen && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-content">
            <h3>Recadrer l'image</h3>
            <div className="crop-container">
              {imageToCrop && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={undefined}
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageToCrop}
                    onLoad={onImageLoad}
                    style={{ maxWidth: '100%', maxHeight: '60vh' }}
                  />
                </ReactCrop>
              )}
            </div>
            <div className="crop-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button variant="outline" onClick={() => setCropModalOpen(false)}>Annuler</Button>
              <Button onClick={applyCrop}>Appliquer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customize;

// Composant d'aperçu isolé et mémoïsé (défini avant usage)
const PreviewCanvas = React.memo(({ 
  showBack, selectedModel, selectedColor, 
  imageLayers, selectedImageId, setSelectedImageId, updateImageLayer,
  canvasRef, 
  textLayers, selectedTextId, setSelectedTextId, updateTextLayer, 
  editingTextId, setEditingTextId, 
  previewMode, canvasZoom, rulerUnit, guideLines, updateGuideLine, deleteGuideLine 
}) => {
  // Priorité : images par couleur > images par défaut > placeholder
  const colorImages = selectedModel?.imagesByColor?.[selectedColor];
  const defaultImages = selectedModel?.images;
  
  const baseSrc = showBack 
    ? (colorImages?.back || defaultImages?.back || DEFAULT_MODEL_PLACEHOLDER.images.back)
    : (colorImages?.front || defaultImages?.front || DEFAULT_MODEL_PLACEHOLDER.images.front);
    
  // État d'interaction (drag/rotate/resize)
  const dragState = React.useRef(null);
  const rotateState = React.useRef(null);
  const resizeState = React.useRef(null);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // Drag image
  const onImagePointerDown = (img, e) => {
    if (img.locked) return;
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSelectedImageId(img.id);
    const startX = e.clientX; const startY = e.clientY;
    dragState.current = { id: img.id, startX, startY, origX: img.xPercent, origY: img.yPercent, type: 'image' };
    
    const onMove = (ev) => {
      const dxPx = ev.clientX - startX;
      const dyPx = ev.clientY - startY;
      const dxPercent = (dxPx / rect.width) * 100;
      const dyPercent = (dyPx / rect.height) * 100;
      const nx = clamp(dragState.current.origX + dxPercent, -20, 120); // Allow moving slightly off-canvas
      const ny = clamp(dragState.current.origY + dyPercent, -20, 120);
      updateImageLayer(dragState.current.id, { xPercent: nx, yPercent: ny });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dragState.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Resize image handle
  const onImageResizePointerDown = (img, e) => {
    if (img.locked) return;
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Center of image in screen coordinates
    const centerX = rect.left + (img.xPercent / 100) * rect.width;
    const centerY = rect.top + (img.yPercent / 100) * rect.height;
    
    // Initial distance from center to pointer
    const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    const startScale = img.scale || 1;
    
    resizeState.current = { id: img.id, startDist, startScale };
    
    const onMove = (ev) => {
      const currentDist = Math.hypot(ev.clientX - centerX, ev.clientY - centerY);
      const newScale = startScale * (currentDist / startDist);
      // Limit scale
      updateImageLayer(resizeState.current.id, { scale: Math.max(0.1, Math.min(5, newScale)) });
    };
    
    const onUp = () => {
       window.removeEventListener('pointermove', onMove);
       window.removeEventListener('pointerup', onUp);
       resizeState.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Rotate image handle
  const onImageRotatePointerDown = (img, e) => {
    if (img.locked) return;
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + (img.xPercent / 100) * rect.width;
    const centerY = rect.top + (img.yPercent / 100) * rect.height;
    rotateState.current = { id: img.id, centerX, centerY, type: 'image' };

    const onMove = (ev) => {
      const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI;
      let snapped = angle;
      if (ev.shiftKey) {
        const increments = [ -180, -135, -90, -45, 0, 45, 90, 135, 180 ];
        snapped = increments.reduce((prev, curr)=> Math.abs(curr-angle) < Math.abs(prev-angle) ? curr : prev, 0);
      }
      updateImageLayer(rotateState.current.id, { rotation: snapped });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      rotateState.current = null;
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

  // Règles de mesure (px/cm)
  const canvasW = canvasRef.current?.clientWidth || 0;
  const canvasH = canvasRef.current?.clientHeight || 0;
  const PX_PER_CM = 37.795; // ~96 dpi / 2.54 cm
  const minorStepPx = rulerUnit === 'cm' ? PX_PER_CM * 0.5 : 50; // 0.5cm ou 50px
  const majorStepPx = rulerUnit === 'cm' ? PX_PER_CM * 1.0 : 100; // 1cm ou 100px
  const xTicks = Array.from({ length: Math.max(1, Math.floor(canvasW / minorStepPx) + 1) }, (_, i) => Math.round(i * minorStepPx));
  const yTicks = Array.from({ length: Math.max(1, Math.floor(canvasH / minorStepPx) + 1) }, (_, i) => Math.round(i * minorStepPx));

  // Drag des repères utilisateur
  const onGuidePointerDown = (g, e) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX; const startY = e.clientY;
    const orig = g.percent;
    const onMove = (ev) => {
      if (g.type === 'vertical') {
        const dxPx = ev.clientX - startX;
        const dxPercent = (dxPx / rect.width) * 100;
        const nx = Math.max(0, Math.min(100, orig + dxPercent));
        updateGuideLine(g.id, { percent: nx });
      } else {
        const dyPx = ev.clientY - startY;
        const dyPercent = (dyPx / rect.height) * 100;
        const ny = Math.max(0, Math.min(100, orig + dyPercent));
        updateGuideLine(g.id, { percent: ny });
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className={`canvas-container ${previewMode ? 'preview-mode' : ''}`} ref={canvasRef} onPointerDown={() => setEditingTextId(null)} style={{ transform: `scale(${canvasZoom})`, transformOrigin: 'center center' }}>
      <img className="product-base" src={baseSrc} alt="Base produit" />
      {imageLayers.filter(img => (showBack ? img.side === 'back' : img.side === 'front') && (img.visible ?? true)).map((img) => (
        <React.Fragment key={img.id}>
          <img
            src={img.url}
            alt="Upload"
            className={`uploaded-image ${selectedImageId === img.id ? 'selected' : ''}`}
            style={{
              left: `${img.xPercent}%`,
              top: `${img.yPercent}%`,
              transform: `translate(-50%, -50%) scale(${img.flipX ? -(img.scale || 1) : (img.scale || 1)}, ${img.scale || 1}) rotate(${img.rotation || 0}deg)`,
              width: '50%',
              zIndex: img.zIndex ?? 2,
              opacity: img.opacity ?? 1,
              cursor: img.locked ? 'not-allowed' : 'move',
              touchAction: 'none',
            }}
            onPointerDown={(e) => onImagePointerDown(img, e)}
          />
          {!previewMode && selectedImageId === img.id && !img.locked && (
            <>
              <div
                className="rotate-handle"
                style={{ left: `${img.xPercent}%`, top: `calc(${img.yPercent}% - 24px)` }}
                onPointerDown={(e) => onImageRotatePointerDown(img, e)}
                title="Pivoter"
              />
              <div
                className="resize-handle"
                style={{ 
                  left: `calc(${img.xPercent}% + ${25 * (img.scale||1)}%)`, 
                  top: `calc(${img.yPercent}% + ${25 * (img.scale||1) / (img.aspect||1)}%)` 
                }}
                onPointerDown={(e) => onImageResizePointerDown(img, e)}
                title="Redimensionner"
              />
            </>
          )}
        </React.Fragment>
      ))}

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
              WebkitTextStroke: t.strokeEnabled ? `${t.strokeWidth || 1}px ${t.strokeColor || '#000000'}` : undefined,
              paintOrder: 'stroke fill',
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

      {/* Guides dynamiques pour texte sélectionné */}
      {nearCenterX && <div className="guide-line vertical" />}
      {nearCenterY && <div className="guide-line horizontal" />}
      {/* Guides dynamiques pour l'image */}
      {selectedImageId && imageLayers.find(i => i.id === selectedImageId) && (Math.abs(imageLayers.find(i => i.id === selectedImageId).xPercent - 50) < 1) && <div className="guide-line vertical" />}
      {selectedImageId && imageLayers.find(i => i.id === selectedImageId) && (Math.abs(imageLayers.find(i => i.id === selectedImageId).yPercent - 50) < 1) && <div className="guide-line horizontal" />}
      {/* Safe-area et axes centraux permanents (édition uniquement) */}
      {!previewMode && (
        <>
          <div className="safe-area" aria-hidden="true" />
          <div className="guide-line vertical" aria-hidden="true" />
          <div className="guide-line horizontal" aria-hidden="true" />
        </>
      )}
      {/* Règles: horizontale (bas / X) et verticale (gauche / Y) avec px et cm */}
      {!previewMode && (
        <>
          <div className="ruler ruler-bottom" aria-hidden="true">
            {xTicks.map((x) => (
              <React.Fragment key={`rx-${x}`}>
                <div className="ruler-tick" style={{ left: `${x}px` }} />
                {(x % Math.round(majorStepPx) === 0) && (
                  <div className="ruler-label" style={{ left: `${x}px` }}>
                    {rulerUnit === 'px' ? `${x}px` : `${(x / PX_PER_CM).toFixed(1)}cm`}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="ruler ruler-left" aria-hidden="true">
            {yTicks.map((y) => (
              <React.Fragment key={`ry-${y}`}>
                <div className="ruler-tick" style={{ top: `${y}px` }} />
                {(y % Math.round(majorStepPx) === 0) && (
                  <div className="ruler-label" style={{ top: `${y}px` }}>
                    {rulerUnit === 'px' ? `${y}px` : `${(y / PX_PER_CM).toFixed(1)}cm`}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Repères utilisateur */}
          {guideLines?.filter(g => (showBack ? g.side==='back' : g.side==='front')).map(g => (
            <div
              key={g.id}
              className={`user-guide ${g.type}`}
              style={g.type==='vertical' ? { left: `${g.percent}%` } : { top: `${g.percent}%` }}
              onPointerDown={(e)=>onGuidePointerDown(g,e)}
            >
              <button className="guide-delete" title="Supprimer" onClick={(e)=>{ e.stopPropagation(); deleteGuideLine(g.id); }}>×</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
});
