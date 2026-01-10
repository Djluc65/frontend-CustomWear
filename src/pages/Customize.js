import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/cn';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';
import { Checkbox } from '../components/ui/checkbox';
import { Select } from '../components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { modelsAPI, productsAPI, customizationPricingAPI, customizationsAPI } from '../services/api';
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

  const handleAddToCartCustomized = async () => {
    try {
      // Déterminer la sélection côté client
      const textFront = Array.isArray(textLayers) && textLayers.some(t => t?.side === 'front' && (t?.visible ?? true));
      const textBack = Array.isArray(textLayers) && textLayers.some(t => t?.side === 'back' && (t?.visible ?? true));
      const imageFront = Boolean(uploadedImageUrl && imageVisible && imageSide === 'front');
      const imageBack = Boolean(uploadedImageUrl && imageVisible && imageSide === 'back');
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
          image: {
            url: uploadedImageUrl || null,
            side: imageSide || (showBack ? 'back' : 'front'),
            visible: Boolean(imageVisible),
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
  // Barre contextuelle à côté du panel gauche
  const [contextOpen, setContextOpen] = useState(false);
  const [activeContextSection, setActiveContextSection] = useState(null); // 'produit' | 'image' | 'texte' | 'save'
  // Références pour scroll vers les sections du panneau gauche
  const produitRef = useRef(null);
  const imageRef = useRef(null);
  const texteRef = useRef(null);
  const saveRef = useRef(null);
  const scrollToSection = (key) => {
    const map = { produit: produitRef, image: imageRef, texte: texteRef, save: saveRef };
    const target = map[key];
    if (target && target.current) {
      try { target.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
    }
    setPanelOpen(prev => ({ ...prev, [key]: true }));
  };
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
    const dataUrl = await imageUrlToDataUrl(uploadedImageUrl || null, 1024);
    const productColorHex = getColorHex(selectedColor) || '#ffffff';
    return {
      productId: selectedModel?._id,
      productType: selectedModel?.category || selectedModel?.type || 't-shirts',
      productColor: productColorHex,
      text: primaryText || undefined,
      image: {
        dataUrl: dataUrl || undefined,
        size: Number((imageScale || 1) * 100),
        rotation: Number(imageRotation || 0),
        position: { x: Number(imageXPercent || 50), y: Number(imageYPercent || 50) },
        side: imageSide || side,
      },
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
        setUploadedImageUrl(image.dataUrl || uploadedImageUrl);
        setImageScale(Number((image.size || 100) / 100));
        setImageRotation(Number(image.rotation || 0));
        setImageXPercent(Number(image.position?.x || 50));
        setImageYPercent(Number(image.position?.y || 50));
        setImageSide(image.side || (showBack ? 'back' : 'front'));
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
    try { localStorage.setItem('cw_auto_customization', JSON.stringify(serializeCustomization())); } catch(e) {}
    setHasAutoDraft(true);
  }, [
    textLayers,
    guideLines,
    rulerUnit,
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
        setGuideLines(data.guideLines || []);
        if (typeof data.showBack === 'boolean') setShowBack(data.showBack);
        if (data.rulerUnit) setRulerUnit(data.rulerUnit);
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
    const size = Number(previewSize) || 2048;
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

  // Supprimer le fond de l'image uploadée (client-side)
  const [bgRemoving, setBgRemoving] = useState(false);
  const handleRemoveBackground = async () => {
    if (!uploadedImageUrl) {
      toast.error("Veuillez uploader une image d’abord.");
      return;
    }
    try {
      setBgRemoving(true);
      const blob = await fetch(uploadedImageUrl).then(r => r.blob());
      if (blob && blob.type === 'image/svg+xml') {
        toast.error('La suppression de fond ne supporte pas les images SVG.');
        setBgRemoving(false);
        return;
      }
      const { removeBackground } = await import('@imgly/background-removal');
      const resultBlob = await removeBackground(blob, { model: 'medium' });
      const nextUrl = URL.createObjectURL(resultBlob);
      if (uploadedImageUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(uploadedImageUrl); } catch (e) {}
      }
      setUploadedImageUrl(nextUrl);
      toast.success('Fond supprimé avec succès !');
    } catch (err) {
      console.error('[Customize] removeBackground error', err);
      toast.error('Échec de la suppression du fond. Réessayez avec une image différente.');
    } finally {
      setBgRemoving(false);
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
      <nav className="flex items-center space-x-1 border-b pb-2 mb-4 overflow-x-auto md:overflow-visible" aria-label="Sous-navigation">
        <NavLink to="/customize" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap", isActive ? "bg-blue-100 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}>Personnalisation</NavLink>
        <NavLink to="/products" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap", isActive ? "bg-blue-100 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}>Produits disponibles</NavLink>
        <NavLink to="/models" className={({ isActive }) => cn("px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap", isActive ? "bg-blue-100 text-blue-700 font-bold" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}>Modèles</NavLink>
      </nav>

      {/* Barre de menus au-dessus des panneaux (Desktop) / En bas (Mobile) */} 
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-background border-t p-2 md:relative md:bottom-auto md:border-t-2 md:border-b-2 md:border-gray-300 md:bg-white/80 md:p-2 md:mb-4 md:justify-start md:gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none" role="navigation" aria-label="Barre de menus"> 
        <Button 
          variant={activeContextSection === 'produit' ? 'default' : 'ghost'} 
          size="sm" 
          className={cn("flex-1 md:flex-none", activeContextSection === 'produit' ? "font-bold" : "")} 
          onClick={() => { setActiveContextSection('produit'); setContextOpen(true); scrollToSection('produit'); }} 
          aria-pressed={activeContextSection === 'produit'} 
        > 
          Modèles 
        </Button> 
        <Button 
          variant={activeContextSection === 'image' ? 'default' : 'ghost'} 
          size="sm" 
          className={cn("flex-1 md:flex-none", activeContextSection === 'image' ? "font-bold" : "")} 
          onClick={() => { setActiveContextSection('image'); setContextOpen(true); scrollToSection('image'); }} 
          aria-pressed={activeContextSection === 'image'} 
        > 
          Image 
        </Button> 
        <Button 
          variant={activeContextSection === 'texte' ? 'default' : 'ghost'} 
          size="sm" 
          className={cn("flex-1 md:flex-none", activeContextSection === 'texte' ? "font-bold" : "")} 
          onClick={() => { setActiveContextSection('texte'); setContextOpen(true); scrollToSection('texte'); }} 
          aria-pressed={activeContextSection === 'texte'} 
        > 
          Texte 
        </Button> 
        <Button 
          variant={activeContextSection === 'save' ? 'default' : 'ghost'} 
          size="sm" 
          className={cn("flex-1 md:flex-none", activeContextSection === 'save' ? "font-bold" : "")} 
          onClick={() => { setActiveContextSection('save'); setContextOpen(true); scrollToSection('save'); }} 
          aria-pressed={activeContextSection === 'save'} 
        > 
          Sauver 
        </Button> 
      </div>

      <div className={cn("customize-content pb-20 md:pb-0")}>
        {/* Panneau gauche: choix modèle et infos */}
        <div className={cn(
          "customize-tools transition-all duration-300",
          contextOpen && activeContextSection ? "fixed bottom-[60px] left-0 right-0 z-40 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] rounded-t-xl h-[50vh] overflow-y-auto p-4 md:static md:h-auto md:bg-transparent md:border-none md:shadow-none md:p-0 md:z-auto" : "hidden md:block"
        )}>
          {/* En-tête mobile pour la fenêtre */}
          <div className="flex md:hidden justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
            <h3 className="font-bold text-lg uppercase">{{
              produit: 'Modèles',
              image: 'Image',
              texte: 'Texte',
              save: 'Sauvegarder'
            }[activeContextSection] || activeContextSection}</h3>
            <Button variant="ghost" size="sm" onClick={() => setContextOpen(false)}>Fermer</Button>
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
                      <button className="chip" onClick={nudgeImageRight}>Déplacer à droite</button>
                      <button className="chip" onClick={alignImageRight}>Aligner à droite</button>
                      <button className="chip" disabled={!uploadedImageUrl || bgRemoving} onClick={handleRemoveBackground}>
                        {bgRemoving ? 'Suppression du fond…' : 'Supprimer le fond'}
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="form-group">
                <label
                  role="button"
                  tabIndex={0}
                  onClick={() => setImageSizeOpen(o => !o)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setImageSizeOpen(o => !o); }}
                  style={{ cursor: 'pointer', width: 'auto', border: '1px solid #3b82f6', padding: 8, borderRadius: 4 , backgroundColor: imageSizeOpen ? '#3b82f6' : 'rgba(232, 232, 232, 0.73)', color: imageSizeOpen ? '#ffffff' : undefined  }}
                >Taille</label>
                {imageSizeOpen && (
                  <input type="range" min="0.2" max="3" step="0.05" value={imageScale} onChange={(e) => setImageScale(Number(e.target.value))} />
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
                  <input type="range" min="-180" max="180" step="1" value={imageRotation} onChange={(e) => setImageRotation(Number(e.target.value))} />
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
                >Visible</label>
                {imageVisibilityOpen && (
                  <div className="options-row">
                    <label className="chip"><input type="checkbox" checked={imageVisible} onChange={() => setImageVisible(v => !v)} /> Visible</label>
                    <button type="button" className={`chip ${imageLocked ? 'active' : ''}`} onClick={() => setImageLocked(v => !v)}>{imageLocked ? 'Déverrouiller' : 'Verrouiller'}</button>
                    <button type="button" className="chip" onClick={() => setImageSide(s => s === 'front' ? 'back' : 'front')}>{imageSide === 'front' ? 'Envoyer à arrière' : 'Envoyer à avant'}</button>
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
                  <input type="range" min="0" max="1" step="0.05" value={imageOpacity} onChange={(e) => setImageOpacity(Number(e.target.value))} />
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
                      <button type="button" className="chip" onClick={() => setImageXPercent(p => Math.max(5, p - 5))}>←</button>
                      <button type="button" className="chip" onClick={() => setImageXPercent(p => Math.min(95, p + 5))}>→</button>
                      <button type="button" className="chip" onClick={() => setImageYPercent(p => Math.max(5, p - 5))}>↑</button>
                      <button type="button" className="chip" onClick={() => setImageYPercent(p => Math.min(95, p + 5))}>↓</button>
                      <button type="button" className="chip" onClick={() => { setImageXPercent(50); setImageYPercent(50); }}>Centrer</button>
                    </div>
                    <div className="form-group" style={{ marginTop: 8 }}>
                      <div className="options-row">
                        <button type="button" className="chip" onClick={() => setImageFlipX(f => !f)}>{imageFlipX ? 'Annuler flip horizontal' : 'Flip horizontal'}</button>
                        <button type="button" className="chip" onClick={() => setImageZIndex(z => Math.max(1, z - 1))}>Arrière-plan</button>
                        <button type="button" className="chip" onClick={() => setImageZIndex(z => Math.min(10, z + 1))}>Premier plan</button>
                      </div>
                      <small style={{ color:'#6b7280' }}>z-index: {imageZIndex} • face: {imageSide}</small>
                    </div>
                  </>
                )}
              </div>
              <div className="form-group">
                <div className="options-row">
                  <button type="button" className="chip" onClick={() => { setImageXPercent(50); setImageYPercent(50); setImageScale(1); setImageRotation(0); setImageOpacity(1); setImageFlipX(false); setImageZIndex(2); setImageSide('front'); }}>Réinitialiser</button>
                  <button type="button" className="chip" onClick={() => { if (uploadedImageUrl && uploadedImageUrl.startsWith('blob:')) { try { URL.revokeObjectURL(uploadedImageUrl); } catch(e) {} } setUploadedImageUrl(''); }}>Supprimer l'image</button>
                </div>
              </div>
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
            <div className="options-row">
              <button className={`chip ${!showBack ? 'active' : ''}`} onClick={() => setShowBack(false)}>Avant</button>
              <button className={`chip ${showBack ? 'active' : ''}`} onClick={() => setShowBack(true)}>Arrière</button>
              <button className={`chip ${previewMode ? 'active' : ''}`} onClick={() => setPreviewMode(!previewMode)}>{previewMode ? 'Mode édition' : 'Mode aperçu'}</button>
              <div className="zoom-controls">
                <span>Zoom</span>
                <input type="range" min="0.5" max="3" step="0.05" value={canvasZoom} onChange={(e)=>setCanvasZoom(Number(e.target.value))} />
                <span>{Math.round(canvasZoom*100)}%</span>
              </div>
              <div className="unit-controls">
                <span>Unité des règles</span>
                <select value={rulerUnit} onChange={(e)=>setRulerUnit(e.target.value)}>
                  <option value="px">Pixels</option>
                  <option value="cm">Centimètres</option>
                </select>
              </div>
              {!previewMode && (
                <div className="guide-controls">
                  <button className="chip" onClick={()=>addGuideLine('vertical')}>Ajouter repère vertical</button>
                  <button className="chip" onClick={()=>addGuideLine('horizontal')}>Ajouter repère horizontal</button>
                </div>
              )}
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

          {/* <div ref={saveRef}> */}
          
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
const PreviewCanvas = React.memo(({ showBack, selectedModel, selectedColor, uploadedImageUrl, imageXPercent, imageYPercent, imageScale, imageRotation, imageVisible, imageLocked, imageOpacity, imageFlipX, imageZIndex, imageSide, setImageXPercent, setImageYPercent, setImageRotation, canvasRef, textLayers, selectedTextId, setSelectedTextId, updateTextLayer, editingTextId, setEditingTextId, previewMode, canvasZoom, rulerUnit, guideLines, updateGuideLine, deleteGuideLine }) => {
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

      {/* Guides dynamiques pour texte sélectionné */}
      {nearCenterX && <div className="guide-line vertical" />}
      {nearCenterY && <div className="guide-line horizontal" />}
      {/* Guides dynamiques pour l'image */}
      {uploadedImageUrl && (Math.abs(imageXPercent - 50) < 1) && <div className="guide-line vertical" />}
      {uploadedImageUrl && (Math.abs(imageYPercent - 50) < 1) && <div className="guide-line horizontal" />}
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