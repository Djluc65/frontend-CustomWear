import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  return COLOR_NAME_TO_HEX[String(name).trim()] || name;
};

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
    back:  'https://res.cloudinary.com/demo/image/upload/w_800,h_800,c_fit/sample.jpg',
  },
};

const Customize = () => {
  const query     = useQuery();
  const productId = query.get('product');
  const variantId = query.get('variant');

  const [models,        setModels]        = useState([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_PLACEHOLDER);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_MODEL_PLACEHOLDER.colors[0]);
  const [selectedSize,  setSelectedSize]  = useState(DEFAULT_MODEL_PLACEHOLDER.sizes[0]);
  const [showBack,      setShowBack]      = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState('');
  const [product,       setProduct]       = useState(null);

  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const [computedTotals, setComputedTotals] = useState({
    customizationPrice: 0,
    baseModelPrice: Number(DEFAULT_MODEL_PLACEHOLDER.basePrice),
    grandTotal: Number(DEFAULT_MODEL_PLACEHOLDER.basePrice),
  });

  /* ── Cart / Checkout ── */
  const handleAddToCartCustomized = async () => {
    try {
      const textFront   = Array.isArray(textLayers) && textLayers.some(t => t?.side === 'front' && (t?.visible ?? true));
      const textBack    = Array.isArray(textLayers) && textLayers.some(t => t?.side === 'back'  && (t?.visible ?? true));
      const imageFront  = Boolean(uploadedImageUrl && imageVisible && imageSide === 'front');
      const imageBack   = Boolean(uploadedImageUrl && imageVisible && imageSide === 'back');
      const baseModelPrice = Number(selectedModel?.basePrice) || Number(DEFAULT_MODEL_PLACEHOLDER.basePrice);

      let serverTotals = null;
      try {
        const resp = await customizationPricingAPI.calculatePrice({ textFront, textBack, imageFront, imageBack, baseModelPrice });
        serverTotals = resp?.data?.data?.totals || null;
      } catch (calcErr) {
        console.warn('[Customize] calculatePrice fallback', calcErr?.response?.data || calcErr);
      }

      const totalPrice = Number(serverTotals?.grandTotal ?? computedTotals?.grandTotal ?? baseModelPrice);
      const currentSideImage =
        selectedModel?.imagesByColor?.[selectedColor]?.[showBack ? 'back' : 'front'] ||
        selectedModel?.images?.[showBack ? 'back' : 'front'] ||
        null;

      const payload = {
        productId: selectedModel?._id,
        quantity:  1,
        price:     totalPrice,
        image:     currentSideImage,
        color:     selectedColor,
        size:      selectedSize,
        customization: {
          selection: { text: { front: textFront, back: textBack }, image: { front: imageFront, back: imageBack } },
          textLayers,
          image: { url: uploadedImageUrl || null, side: imageSide || (showBack ? 'back' : 'front'), visible: Boolean(imageVisible) },
          totals: serverTotals || computedTotals || { baseModelPrice, customizationPrice: 0, grandTotal: baseModelPrice },
          technique: selectedTechnique,
        },
        product: {
          _id: selectedModel?._id,
          name: selectedModel?.name,
          price: { base: baseModelPrice },
          images: selectedModel?.images,
          category: selectedModel?.category,
        },
      };

      if (!payload.productId) { toast.error("Modèle introuvable"); return; }
      dispatch(addToCart(payload));
      toast.success('Personnalisation ajoutée au panier !');
    } catch (err) {
      console.error('[Customize] handleAddToCartCustomized error', err);
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  const handleCheckoutCustomized = () => {
    handleAddToCartCustomized();
    navigate('/checkout');
  };

  /* ── State ── */
  const [productLoading, setProductLoading] = useState(false);
  const [productError,   setProductError]   = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const [activeContextSection, setActiveContextSection] = useState(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  const produitRef = useRef(null);
  const imageRef   = useRef(null);
  const texteRef   = useRef(null);
  const saveRef    = useRef(null);

  /* Detect mobile resize */
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  const scrollToSection = (key) => {
    const map = { produit: produitRef, image: imageRef, texte: texteRef, save: saveRef };
    const target = map[key];
    if (target?.current) {
      try { target.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
    }
  };

  /* Image state */
  const [imageXPercent,      setImageXPercent]      = useState(50);
  const [imageYPercent,      setImageYPercent]      = useState(50);
  const [imageScale,         setImageScale]         = useState(1);
  const [imageRotation,      setImageRotation]      = useState(0);
  const [imageVisible,       setImageVisible]       = useState(true);
  const [imageLocked,        setImageLocked]        = useState(false);
  const [imageOpacity,       setImageOpacity]       = useState(1);
  const [imageFlipX,         setImageFlipX]         = useState(false);
  const [imageZIndex,        setImageZIndex]        = useState(2);
  const [imageSide,          setImageSide]          = useState('front');

  /* Image panel toggles */
  const [imageUploaderOpen,  setImageUploaderOpen]  = useState(false);
  const [imageSizeOpen,      setImageSizeOpen]      = useState(false);
  const [imageRotationOpen,  setImageRotationOpen]  = useState(false);
  const [imageVisibilityOpen,setImageVisibilityOpen]= useState(false);
  const [imageOpacityOpen,   setImageOpacityOpen]   = useState(false);
  const [imagePositionOpen,  setImagePositionOpen]  = useState(false);

  const canvasRef = useRef(null);

  /* Text layers */
  const [textLayers,    setTextLayers]    = useState([]);
  const [selectedTextId,setSelectedTextId]= useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [textCharLimit, setTextCharLimit] = useState(50);

  /* History */
  const [history,        setHistory]        = useState([]);
  const [future,         setFuture]         = useState([]);
  const [historyActions, setHistoryActions] = useState([]);

  /* Canvas */
  const [previewMode, setPreviewMode] = useState(false);
  const [canvasZoom,  setCanvasZoom]  = useState(1);
  const [rulerUnit,   setRulerUnit]   = useState('px');
  const [guideLines,  setGuideLines]  = useState([]);

  /* Save */
  const [savedName,    setSavedName]    = useState('');
  const [savedList,    setSavedList]    = useState(() => {
    try { const arr = JSON.parse(localStorage.getItem('cw_customizations')); return Array.isArray(arr) ? arr : []; }
    catch (_) { return []; }
  });
  const [hasAutoDraft, setHasAutoDraft] = useState(() => Boolean(localStorage.getItem('cw_auto_customization')));
  const [previewSize,  setPreviewSize]  = useState(2048);
  const [includeGuides,setIncludeGuides]= useState(false);
  const [serverLoadId, setServerLoadId] = useState('');
  const [bgRemoving,   setBgRemoving]   = useState(false);

  /* ── History helpers ── */
  const pushHistory = (label) => {
    setHistory(prev => [...prev, JSON.stringify(textLayers)]);
    setHistoryActions(prev => [...prev, label]);
    setFuture([]);
  };

  const undo = () => {
    setHistory(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setFuture(f => [JSON.stringify(textLayers), ...f]);
      setTextLayers(JSON.parse(last));
      return prev.slice(0, -1);
    });
    setEditingTextId(null);
  };

  const redo = () => {
    setFuture(prev => {
      if (!prev.length) return prev;
      const next = prev[0];
      setHistory(h => [...h, JSON.stringify(textLayers)]);
      setTextLayers(JSON.parse(next));
      return prev.slice(1);
    });
    setEditingTextId(null);
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [textLayers]);

  /* ── Text layer helpers ── */
  const createTextLayer = (overrides = {}) => ({
    id: `text-${Date.now()}`,
    content: 'Votre texte', xPercent: 50, yPercent: 50,
    rotation: 0, scale: 1, fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 32, fontWeight: 400, fontStyle: 'normal',
    textDecoration: 'none', letterSpacing: 0, lineHeight: 1.2,
    textTransform: 'none', color: '#111827',
    backgroundEnabled: false, backgroundColor: '#ffffff', padding: 4,
    borderEnabled: false, borderColor: '#000000', borderWidth: 0, borderStyle: 'solid',
    shadowEnabled: false, shadowX: 0, shadowY: 0, shadowBlur: 0, shadowColor: 'rgba(0,0,0,0.3)',
    opacity: 1, locked: false, visible: true, name: 'Texte', zIndex: 1, side: 'front',
    ...overrides,
  });

  const addTextLayer = () => {
    const idx  = textLayers.length + 1;
    const next = createTextLayer({ name: `Texte ${idx}`, side: showBack ? 'back' : 'front', visible: true, zIndex: idx });
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
    if (editingTextId  === id) setEditingTextId(null);
  };

  const duplicateTextLayer = (id) => {
    const base = textLayers.find(t => t.id === id);
    if (!base) return;
    const clone = createTextLayer({ ...base, id: `text-${Date.now()}-copy`, name: `${base.name} (copie)`, xPercent: Math.min(base.xPercent+3,95), yPercent: Math.min(base.yPercent+3,95), zIndex: textLayers.length+1 });
    pushHistory('Dupliquer texte');
    setTextLayers(prev => [...prev, clone]);
    setSelectedTextId(clone.id);
  };

  const toggleLockTextLayer      = (id) => { const t = textLayers.find(x=>x.id===id); if(!t) return; updateTextLayer(id,{locked:!t.locked},t.locked?'Déverrouiller':'Verrouiller'); };
  const renameTextLayer          = (id, name) => updateTextLayer(id,{name},'Renommer texte');
  const toggleVisibilityTextLayer= (id) => { const t = textLayers.find(x=>x.id===id); if(!t) return; updateTextLayer(id,{visible:!(t.visible??true)},(t.visible??true)?'Masquer':'Afficher'); };

  const moveTextLayerUp = (id) => {
    setTextLayers(prev => {
      const i = prev.findIndex(t => t.id === id);
      if (i < 0 || i === prev.length-1) return prev;
      const n = [...prev]; [n[i],n[i+1]]=[n[i+1],n[i]];
      return n.map((t,j)=>({...t,zIndex:j+1}));
    }); pushHistory("Monter d'un niveau");
  };

  const moveTextLayerDown = (id) => {
    setTextLayers(prev => {
      const i = prev.findIndex(t => t.id === id);
      if (i <= 0) return prev;
      const n = [...prev]; [n[i],n[i-1]]=[n[i-1],n[i]];
      return n.map((t,j)=>({...t,zIndex:j+1}));
    }); pushHistory("Descendre d'un niveau");
  };

  const bringTextLayerToFront = (id) => {
    setTextLayers(prev => { const i=prev.findIndex(t=>t.id===id); if(i<0)return prev; const item=prev[i]; const n=[...prev.slice(0,i),...prev.slice(i+1),item]; return n.map((t,j)=>({...t,zIndex:j+1})); }); pushHistory('Premier plan');
  };
  const sendTextLayerToBack = (id) => {
    setTextLayers(prev => { const i=prev.findIndex(t=>t.id===id); if(i<0)return prev; const item=prev[i]; const n=[item,...prev.slice(0,i),...prev.slice(i+1)]; return n.map((t,j)=>({...t,zIndex:j+1})); }); pushHistory('Arrière-plan');
  };

  const alignTextHorizontal = (id, pos) => updateTextLayer(id,{xPercent:{left:8,center:50,right:92}[pos]??50},'Aligner H');
  const alignTextVertical   = (id, pos) => updateTextLayer(id,{yPercent:{top:8,middle:50,bottom:92}[pos]??50},'Aligner V');
  const rotateTextTo        = (id, angle) => updateTextLayer(id,{rotation:angle},'Rotation');

  /* ── Guide helpers ── */
  const addGuideLine    = (type) => { const id='g_'+Date.now()+'_'+Math.random().toString(36).slice(2,7); setGuideLines(prev=>[...prev,{id,type,percent:50,side:showBack?'back':'front'}]); };
  const updateGuideLine = (id, updates) => setGuideLines(prev=>prev.map(g=>g.id===id?{...g,...updates}:g));
  const deleteGuideLine = (id) => setGuideLines(prev=>prev.filter(g=>g.id!==id));

  /* ── Serialization ── */
  const serializeCustomization = () => ({ selectedColor, showBack, rulerUnit, guideLines, textLayers, uploadedImageUrl, imageXPercent, imageYPercent, imageScale, imageRotation, imageVisible, imageLocked, imageOpacity, imageFlipX, imageZIndex, imageSide });

  const applyDeserialized = (data) => {
    setTextLayers(data.textLayers || []);
    setGuideLines(data.guideLines || []);
    if (typeof data.showBack    === 'boolean') setShowBack(data.showBack);
    if (data.rulerUnit)                        setRulerUnit(data.rulerUnit);
    if (data.selectedColor)                    setSelectedColor(data.selectedColor);
    if (typeof data.uploadedImageUrl === 'string') setUploadedImageUrl(data.uploadedImageUrl);
    if (typeof data.imageXPercent === 'number') setImageXPercent(data.imageXPercent);
    if (typeof data.imageYPercent === 'number') setImageYPercent(data.imageYPercent);
    if (typeof data.imageScale    === 'number') setImageScale(data.imageScale);
    if (typeof data.imageRotation === 'number') setImageRotation(data.imageRotation);
    if (typeof data.imageVisible  === 'boolean') setImageVisible(data.imageVisible);
    if (typeof data.imageLocked   === 'boolean') setImageLocked(data.imageLocked);
    if (typeof data.imageOpacity  === 'number') setImageOpacity(data.imageOpacity);
    if (typeof data.imageFlipX    === 'boolean') setImageFlipX(data.imageFlipX);
    if (typeof data.imageZIndex   === 'number') setImageZIndex(data.imageZIndex);
    if (typeof data.imageSide     === 'string') setImageSide(data.imageSide);
    setSelectedTextId(null); setEditingTextId(null);
  };

  /* ── Save helpers ── */
  const extractPrimaryTextConfig = (side) => {
    try {
      const t = textLayers.filter(x=>(x.side===side)&&(x.visible??true))[0];
      if (!t) return null;
      return { content:t.content||'', font:t.fontFamily||'Arial', fontSize:Number(t.fontSize||24), color:t.color||'#000000', rotation:Number(t.rotation||0), align:t.align||'center', position:{x:Number(t.xPercent||50),y:Number(t.yPercent||50)}, side };
    } catch { return null; }
  };

  const imageUrlToDataUrl = async (url, w=1024) => {
    if (!url) return null;
    const img = await new Promise((res,rej)=>{ const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>res(i); i.onerror=rej; i.src=url; });
    const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=Math.round(w*(img.height/img.width));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/png');
  };

  const buildServerPayload = async () => {
    const side=showBack?'back':'front';
    return { productId:selectedModel?._id, productType:selectedModel?.category||'t-shirts', productColor:getColorHex(selectedColor)||'#ffffff', text:extractPrimaryTextConfig(side)||undefined, image:{ dataUrl:await imageUrlToDataUrl(uploadedImageUrl||null,1024)||undefined, size:Number((imageScale||1)*100), rotation:Number(imageRotation||0), position:{x:Number(imageXPercent||50),y:Number(imageYPercent||50)}, side:imageSide||side }, background:undefined };
  };

  const saveCustomizationServer = async () => {
    try {
      if (!selectedModel?._id) { toast.error('Modèle introuvable.'); return; }
      const res=await customizationsAPI.saveCustomization(await buildServerPayload());
      const serverId=res?.data?.data?.id||res?.data?.data?._id||res?.data?.data?.customization?._id;
      if (!serverId) { toast.error("ID manquant dans la réponse serveur."); return; }
      const name=(savedName&&savedName.trim())?savedName.trim():`Création ${new Date().toLocaleString()}`;
      const entry={id:'srv_'+serverId,name,timestamp:Date.now(),data:serializeCustomization(),serverId};
      setSavedList(prev=>{ const merged=[entry,...prev].slice(0,20); try{localStorage.setItem('cw_customizations',JSON.stringify(merged));}catch(_){} return merged; });
      const link=`${window.location.origin}${window.location.pathname}?custom=${serverId}`;
      if (navigator.clipboard&&window.isSecureContext) { try{await navigator.clipboard.writeText(link);}catch(_){} }
      toast.success('Enregistré en ligne. Lien copié.');
    } catch (err) { toast.error(err?.response?.data?.message||err?.message||'Erreur sauvegarde en ligne'); }
  };

  const loadCustomizationServerById = async (id) => {
    try {
      const cleanId=(id||'').trim(); if(!cleanId){toast.error('ID requis.');return;}
      const res=await customizationsAPI.getCustomization(cleanId);
      const doc=res?.data?.data; if(!doc){toast.error('Introuvable.');return;}
      const colorName=Object.entries(COLOR_NAME_TO_HEX).find(([,hex])=>String(hex).toLowerCase()===String(doc.productColor||'').toLowerCase())?.[0]||selectedColor;
      setSelectedColor(colorName);
      if (doc.text) { const nt={id:'srv_text_'+Date.now(),content:doc.text.content||'',fontFamily:doc.text.font||'Arial',fontSize:Number(doc.text.fontSize||24),color:doc.text.color||'#000000',rotation:Number(doc.text.rotation||0),align:doc.text.align||'center',xPercent:Number(doc.text.position?.x||50),yPercent:Number(doc.text.position?.y||50),side:doc.text.side||'front',zIndex:3,visible:true}; setTextLayers(prev=>[nt,...prev]); setShowBack((doc.text.side||'front')==='back'); }
      if (doc.image) { setUploadedImageUrl(doc.image.dataUrl||uploadedImageUrl); setImageScale(Number((doc.image.size||100)/100)); setImageRotation(Number(doc.image.rotation||0)); setImageXPercent(Number(doc.image.position?.x||50)); setImageYPercent(Number(doc.image.position?.y||50)); setImageSide(doc.image.side||(showBack?'back':'front')); setShowBack((doc.image.side||'front')==='back'); }
      toast.success('Chargé depuis le serveur.');
    } catch (err) { toast.error(err?.response?.data?.message||err?.message||'Erreur chargement'); }
  };

  const saveCustomizationLocal = () => {
    try {
      const data=serializeCustomization();
      localStorage.setItem('cw_customization',JSON.stringify(data));
      const id='sv_'+Date.now();
      const name=(savedName&&savedName.trim())?savedName.trim():`Création ${new Date().toLocaleString()}`;
      const next={id,name,timestamp:Date.now(),data};
      setSavedList(prev=>{ const merged=[next,...prev].slice(0,20); try{localStorage.setItem('cw_customizations',JSON.stringify(merged));}catch(_){} return merged; });
      toast.success('Création sauvegardée.');
    } catch { toast.error('Erreur sauvegarde.'); }
  };

  const loadCustomizationLocal = () => {
    try {
      const raw=localStorage.getItem('cw_customization');
      if (!raw){toast.info('Aucune sauvegarde.');return;}
      applyDeserialized(JSON.parse(raw));
      toast.success('Création chargée.');
    } catch { toast.error('Erreur chargement.'); }
  };

  const loadSavedById = (id) => {
    const found=savedList.find(s=>s.id===id);
    if (!found){toast.error('Introuvable.');return;}
    try { applyDeserialized(found.data||{}); toast.success(`"${found.name}" chargée.`); }
    catch { toast.error('Erreur chargement sauvegarde.'); }
  };

  const deleteSavedById = (id) => {
    setSavedList(prev=>{ const next=prev.filter(s=>s.id!==id); try{localStorage.setItem('cw_customizations',JSON.stringify(next));}catch(_){} return next; });
    toast.success('Sauvegarde supprimée.');
  };

  const renameSavedById = (id, name) => {
    const n=(name||'').trim(); if(!n){toast.error('Nom invalide.');return;}
    setSavedList(prev=>{ const next=prev.map(s=>s.id===id?{...s,name:n}:s); try{localStorage.setItem('cw_customizations',JSON.stringify(next));}catch(_){} return next; });
    toast.success('Renommée.');
  };

  const generateShareLink = async () => {
    try {
      const url=`${window.location.origin}${window.location.pathname}?c=${btoa(encodeURIComponent(JSON.stringify(serializeCustomization())))}`;
      if (navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);toast.success('Lien copié.');}
      else{window.prompt('Copiez ce lien:',url);toast.info('Copiez le lien.');}
    } catch { toast.error('Erreur lien de partage.'); }
  };

  const loadAutoDraft = () => {
    try {
      const raw=localStorage.getItem('cw_auto_customization');
      if(!raw){toast.info('Aucun brouillon.');return;}
      applyDeserialized(JSON.parse(raw));
      toast.success('Brouillon repris.');
    } catch { toast.error('Impossible de reprendre.'); }
  };

  /* Auto-save draft */
  useEffect(() => {
    try{localStorage.setItem('cw_auto_customization',JSON.stringify(serializeCustomization()));}catch(_){}
    setHasAutoDraft(true);
  }, [textLayers,guideLines,rulerUnit,selectedColor,showBack,uploadedImageUrl,imageXPercent,imageYPercent,imageScale,imageRotation,imageVisible,imageLocked,imageOpacity,imageFlipX,imageZIndex,imageSide]);

  /* Load from share URL */
  useEffect(() => {
    const c=new URLSearchParams(window.location.search).get('c');
    if (c){try{applyDeserialized(JSON.parse(decodeURIComponent(atob(c))));}catch(_){}}
  }, []);

  /* ── Preview download ── */
  const getBaseImageSrc = () => {
    const ci=selectedModel?.imagesByColor?.[selectedColor];
    const di=selectedModel?.images;
    return showBack?(ci?.back||di?.back||DEFAULT_MODEL_PLACEHOLDER.images.back):(ci?.front||di?.front||DEFAULT_MODEL_PLACEHOLDER.images.front);
  };

  const downloadPreviewImage = async () => {
    const canvas=document.createElement('canvas'); const size=Number(previewSize)||2048;
    canvas.width=size; canvas.height=size;
    const ctx=canvas.getContext('2d');
    const loadImg=(src)=>new Promise((res,rej)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>res(img);img.onerror=rej;img.src=src;});
    try {
      ctx.drawImage(await loadImg(getBaseImageSrc()),0,0,size,size);
      const layers=[];
      if(uploadedImageUrl&&(showBack?imageSide==='back':imageSide==='front')&&imageVisible) layers.push({type:'image',zIndex:imageZIndex});
      textLayers.filter(t=>(showBack?t.side==='back':t.side==='front')&&(t.visible??true)).forEach(t=>layers.push({type:'text',zIndex:t.zIndex||3,data:t}));
      layers.sort((a,b)=>(a.zIndex||0)-(b.zIndex||0));
      for(const layer of layers){
        if(layer.type==='image'){
          const up=await loadImg(uploadedImageUrl); const w=size*0.5; const h=up.height*(w/up.width);
          ctx.save(); ctx.translate((imageXPercent/100)*size,(imageYPercent/100)*size); ctx.rotate((imageRotation||0)*Math.PI/180); ctx.scale((imageFlipX?-1:1)*(imageScale||1),imageScale||1); ctx.globalAlpha=imageOpacity??1; ctx.drawImage(up,-w/2,-h/2,w,h); ctx.restore();
        } else {
          const t=layer.data; ctx.save(); ctx.translate((t.xPercent/100)*size,(t.yPercent/100)*size); ctx.rotate((t.rotation||0)*Math.PI/180); ctx.scale(t.scale||1,t.scale||1);
          ctx.font=`${t.fontStyle||'normal'} ${t.fontWeight||400} ${t.fontSize||32}px ${(t.fontFamily||'Arial').split(',')[0]}`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.globalAlpha=t.opacity??1;
          if(t.shadowEnabled){ctx.shadowColor=t.shadowColor;ctx.shadowBlur=t.shadowBlur;ctx.shadowOffsetX=t.shadowX;ctx.shadowOffsetY=t.shadowY;}
          const mw=ctx.measureText(t.content||'').width; const mh=(t.fontSize||32)*(t.lineHeight||1.2);
          if(t.backgroundEnabled){ctx.fillStyle=t.backgroundColor||'#fff';const p=t.padding||4;ctx.fillRect(-mw/2-p,-mh/2-p,mw+p*2,mh+p*2);}
          if(t.borderEnabled){ctx.strokeStyle=t.borderColor||'#000';ctx.lineWidth=t.borderWidth||1;const p=t.padding||4;ctx.strokeRect(-mw/2-p,-mh/2-p,mw+p*2,mh+p*2);}
          ctx.fillStyle=t.color||'#111827'; ctx.fillText(t.content||'',0,0); ctx.restore();
        }
      }
      if(includeGuides){
        const ug=guideLines.filter(g=>(showBack?g.side==='back':g.side==='front'));
        ctx.save(); ctx.strokeStyle='#ef4444'; ctx.lineWidth=2; ctx.globalAlpha=0.6;
        for(const g of ug){if(g.type==='vertical'){const x=(g.percent/100)*size;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,size);ctx.stroke();}else{const y=(g.percent/100)*size;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(size,y);ctx.stroke();}}
        ctx.restore();
      }
      const safeName=(savedName&&savedName.trim())?savedName.trim().toLowerCase().replace(/\s+/g,'-'):'creation';
      const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download=`customwear-${safeName}-${size}px.png`; a.click();
      toast.success('Aperçu téléchargé.');
    } catch { toast.error("Erreur téléchargement aperçu."); }
  };

  const exportCustomizationFile = () => {
    try {
      const blob=new Blob([JSON.stringify(serializeCustomization(),null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const safeName=(savedName&&savedName.trim())?savedName.trim().toLowerCase().replace(/\s+/g,'-'):'creation';
      const a=document.createElement('a'); a.href=url; a.download=`customwear-${safeName}.json`; a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      toast.success('Exporté.');
    } catch { toast.error("Erreur export."); }
  };

  const importCustomizationFile = async (e) => {
    try {
      const file=e.target.files?.[0]; if(!file) return;
      applyDeserialized(JSON.parse(await file.text()));
      toast.success('Importé.');
    } catch { toast.error('Fichier invalide.'); }
  };

  /* ── Model loading ── */
  useEffect(() => {
    let mounted=true;
    modelsAPI.getModels().then(res=>{
      const data=res?.data?.data||res?.data||[];
      if(!mounted) return;
      setModels(Array.isArray(data)?data:[]);
      const first=(Array.isArray(data)?data:[]).find(m=>m?.active);
      if(first){setSelectedModel(first);setSelectedColor(first.colors?.[0]||DEFAULT_MODEL_PLACEHOLDER.colors[0]);setSelectedSize((sortSizes(first.sizes||[]))[0]||DEFAULT_MODEL_PLACEHOLDER.sizes[0]);}
    }).catch(err=>console.error('[Customize] getModels',err));
    return ()=>{mounted=false;};
  },[]);

  useEffect(()=>{
    if(!productId) return;
    let mounted=true; setProductLoading(true); setProductError(null);
    productsAPI.getProduct(productId).then(res=>{if(mounted)setProduct(res?.data?.data||res?.data);}).catch(err=>setProductError(err?.response?.data?.message||'Erreur')).finally(()=>{if(mounted)setProductLoading(false);});
    return ()=>{mounted=false;};
  },[productId]);

  /* URL → model pre-select */
  const availableColors = useMemo(()=>Array.isArray(selectedModel?.colors)&&selectedModel.colors.length?selectedModel.colors:DEFAULT_MODEL_PLACEHOLDER.colors,[selectedModel]);
  const availableSizes  = useMemo(()=>sortSizes(Array.isArray(selectedModel?.sizes)&&selectedModel.sizes.length?selectedModel.sizes:['XS','S','M','L','XL','2XL','3XL','4XL','5XL']),[selectedModel]);
  const activeModels    = useMemo(()=>models.filter(m=>m?.active!==false),[models]);

  const handleModelChange = (modelId) => {
    const next=activeModels.find(m=>String(m._id)===String(modelId))||selectedModel;
    setSelectedModel(next);
    if(next){setSelectedColor(next.colors?.[0]||selectedColor);const s=sortSizes(next.sizes||[]);setSelectedSize(s[0]||selectedSize);}
  };

  useEffect(()=>{
    const modelId=query.get('model');
    if(!modelId||!activeModels.length) return;
    const next=activeModels.find(m=>String(m._id)===String(modelId));
    if(next&&next._id!==selectedModel?._id){setSelectedModel(next);if(next.colors?.length)setSelectedColor(next.colors[0]);}
  },[query,activeModels]);

  useEffect(()=>{
    const section=query.get('section');
    if(section){const el=document.getElementById(section);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
  },[query]);

  /* Image helpers */
  const nudgeImageRight = ()=>setImageXPercent(p=>Math.min(p+5,98));
  const alignImageRight = ()=>setImageXPercent(92);

  useEffect(()=>{return()=>{if(uploadedImageUrl?.startsWith('blob:'))try{URL.revokeObjectURL(uploadedImageUrl);}catch(_){}};},[uploadedImageUrl]);

  useEffect(()=>{
    const front=selectedModel?.images?.front||DEFAULT_MODEL_PLACEHOLDER.images.front;
    const back =selectedModel?.images?.back ||DEFAULT_MODEL_PLACEHOLDER.images.back;
    const ci   =selectedModel?.imagesByColor?.[selectedColor];
    [front,back,ci?.front,ci?.back].forEach(src=>{if(src){const img=new Image();img.src=src;}});
  },[selectedModel,selectedColor]);

  const handleFileUpload = (e) => {
    const file=e.target.files?.[0]; if(!file) return;
    if(uploadedImageUrl?.startsWith('blob:'))try{URL.revokeObjectURL(uploadedImageUrl);}catch(_){}
    setUploadedImageUrl(URL.createObjectURL(file));
  };

  const handleRemoveBackground = async () => {
    if(!uploadedImageUrl){toast.error("Uploadez d'abord une image.");return;}
    try {
      setBgRemoving(true);
      const blob=await fetch(uploadedImageUrl).then(r=>r.blob());
      if(blob.type==='image/svg+xml'){toast.error('SVG non supporté.');setBgRemoving(false);return;}
      const {removeBackground}=await import('@imgly/background-removal');
      const result=await removeBackground(blob,{model:'medium'});
      const next=URL.createObjectURL(result);
      if(uploadedImageUrl.startsWith('blob:'))try{URL.revokeObjectURL(uploadedImageUrl);}catch(_){}
      setUploadedImageUrl(next);
      toast.success('Fond supprimé !');
    } catch { toast.error('Échec suppression fond.'); }
    finally { setBgRemoving(false); }
  };

  /* ── Toggle label style helper ── */
  const toggleLabelStyle = (isOpen) => ({
    cursor:'pointer', width:'auto', border:'1px solid #3b82f6', padding:'8px',
    borderRadius:'4px',
    backgroundColor: isOpen ? '#3b82f6' : undefined,
    color: isOpen ? '#ffffff' : undefined,
  });

  const IconFilter = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );

  const IconImage = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );

  const IconText = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );

  const IconSave = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );

  const menubarIconByKey = {
    produit: <IconFilter />,
    image: <IconImage />,
    texte: <IconText />,
    save: <IconSave />,
  };

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div className="customize-page">
      <div className="customize-header">
        <div className="customize-title">
          <h1>Personnalisation du produit</h1>
        </div>
      </div>

      <nav className="models-subnav" aria-label="Sous-navigation">
        <NavLink to="/customize" className={({isActive})=>`subnav-link${isActive?' active':''}`}>Personnalisation</NavLink>
        <NavLink to="/products"  className={({isActive})=>`subnav-link${isActive?' active':''}`}>Produits disponibles</NavLink>
        <NavLink to="/models"    className={({isActive})=>`subnav-link${isActive?' active':''}`}>Modèles</NavLink>
      </nav>

      {/* ── Menubar ── */}
      <div className="customize-menubar" role="navigation" aria-label="Barre de menus">
        {[
          { key:'produit', label:'Filtrer les modèles', shortLabel:'Filtrer' },
          { key:'image',   label:'Ajouter une image',   shortLabel:'Image'   },
          { key:'texte',   label:'Ajouter un texte',    shortLabel:'Texte'   },
          { key:'save',    label:'Sauvegarde',          shortLabel:'Sauver'  },
        ].map(({key,label,shortLabel})=>(
          <button
            key={key}
            type="button"
            className={`chip ${activeContextSection===key?'active':''} ${key==='save'?'btn-save':''}`}
            onClick={()=>{
              if (activeContextSection === key && isMobile) {
                // Toggle off: close the panel
                setSheetOpen(false);
                setActiveContextSection(null);
              } else {
                setActiveContextSection(key);
                setContextOpen(true);
                if (isMobile) {
                  setSheetOpen(true);
                } else {
                  scrollToSection(key);
                }
              }
            }}
            aria-pressed={activeContextSection===key}
          >
            {menubarIconByKey[key] || null}
            <span className="customize-menubar-label full">{label}</span>
            <span className="customize-menubar-label short">{shortLabel}</span>
          </button>
        ))}
      </div>

      <div className="customize-content">
        {/* ── LEFT TOOLS ── */}
        <div className="customize-tools">
          <div className="container-panel">

            {/* PRODUIT */}
            {activeContextSection==='produit' && (
              <div ref={produitRef} className="panel open" role="region" aria-label="Filtrer les modèles">
                <div className="panel-content" onClick={e=>e.stopPropagation()}>
                  <div className="form-group">
                    <label>Modèle</label>
                    <select value={selectedModel?._id||''} onChange={e=>handleModelChange(e.target.value)}>
                      {activeModels.map(m=><option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Prix du modèle</label>
                    <div className="model-price-inline">
                      {Number.isFinite(Number(selectedModel?.basePrice))?`${Number(selectedModel.basePrice).toFixed(2)} €`:`${Number(DEFAULT_MODEL_PLACEHOLDER.basePrice).toFixed(2)} €`}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Couleur</label>
                    <div className="options-row">
                      {availableColors.map(color=>(
                        <button key={color} className={`chip color-chip ${selectedColor===color?'active':''}`} onClick={()=>setSelectedColor(color)}>
                          <div className="color-swatch" style={{backgroundColor:color.toLowerCase()}} />{color}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tailles</label>
                    <div className="options-row">
                      {availableSizes.map(size=>(
                        <button key={size} type="button" className={`chip ${selectedSize===size?'active':''}`} onClick={()=>setSelectedSize(size)}>{size}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* IMAGE */}
            {activeContextSection==='image' && (
              <div ref={imageRef} className="panel open" role="region" aria-label="Ajouter une image">
                <div className="panel-content" onClick={e=>e.stopPropagation()}>
                  {/* Upload */}
                  <div className="form-group">
                    <label role="button" tabIndex={0} onClick={()=>setImageUploaderOpen(o=>!o)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setImageUploaderOpen(o=>!o);}} style={toggleLabelStyle(imageUploaderOpen)}>
                      Uploader une image (PNG/JPG/SVG)
                    </label>
                    {imageUploaderOpen&&(<>
                      <input type="file" accept="image/*,.svg" onChange={handleFileUpload} />
                      <div className="quick-actions" style={{marginTop:8}}>
                        <button className="chip" onClick={nudgeImageRight}>Déplacer à droite</button>
                        <button className="chip" onClick={alignImageRight}>Aligner à droite</button>
                        <button className="chip" disabled={!uploadedImageUrl||bgRemoving} onClick={handleRemoveBackground}>{bgRemoving?'Suppression…':'Supprimer le fond'}</button>
                      </div>
                    </>)}
                  </div>
                  {/* Taille */}
                  <div className="form-group">
                    <label role="button" tabIndex={0} onClick={()=>setImageSizeOpen(o=>!o)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setImageSizeOpen(o=>!o);}} style={toggleLabelStyle(imageSizeOpen)}>Taille</label>
                    {imageSizeOpen&&<input type="range" min="0.2" max="3" step="0.05" value={imageScale} onChange={e=>setImageScale(Number(e.target.value))} />}
                  </div>
                  {/* Rotation */}
                  <div className="form-group">
                    <label role="button" tabIndex={0} onClick={()=>setImageRotationOpen(o=>!o)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setImageRotationOpen(o=>!o);}} style={toggleLabelStyle(imageRotationOpen)}>Rotation</label>
                    {imageRotationOpen&&<input type="range" min="-180" max="180" step="1" value={imageRotation} onChange={e=>setImageRotation(Number(e.target.value))} />}
                  </div>
                  {/* Visible */}
                  <div className="form-group">
                    <label role="button" tabIndex={0} onClick={()=>setImageVisibilityOpen(o=>!o)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setImageVisibilityOpen(o=>!o);}} style={toggleLabelStyle(imageVisibilityOpen)}>Visible</label>
                    {imageVisibilityOpen&&(
                      <div className="options-row">
                        <label className="chip"><input type="checkbox" checked={imageVisible} onChange={()=>setImageVisible(v=>!v)} /> Visible</label>
                        <button type="button" className={`chip ${imageLocked?'active':''}`} onClick={()=>setImageLocked(v=>!v)}>{imageLocked?'Déverrouiller':'Verrouiller'}</button>
                        <button type="button" className="chip" onClick={()=>setImageSide(s=>s==='front'?'back':'front')}>{imageSide==='front'?'Envoyer à arrière':'Envoyer à avant'}</button>
                      </div>
                    )}
                  </div>
                  {/* Opacité */}
                  <div className="form-group">
                    <label role="button" tabIndex={0} onClick={()=>setImageOpacityOpen(o=>!o)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setImageOpacityOpen(o=>!o);}} style={toggleLabelStyle(imageOpacityOpen)}>Opacité</label>
                    {imageOpacityOpen&&<input type="range" min="0" max="1" step="0.05" value={imageOpacity} onChange={e=>setImageOpacity(Number(e.target.value))} />}
                  </div>
                  {/* Position */}
                  <div className="form-group">
                    <label role="button" tabIndex={0} onClick={()=>setImagePositionOpen(o=>!o)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')setImagePositionOpen(o=>!o);}} style={toggleLabelStyle(imagePositionOpen)}>Position</label>
                    {imagePositionOpen&&(<>
                      <div className="options-row">
                        <button type="button" className="chip" onClick={()=>setImageXPercent(p=>Math.max(5,p-5))}>←</button>
                        <button type="button" className="chip" onClick={()=>setImageXPercent(p=>Math.min(95,p+5))}>→</button>
                        <button type="button" className="chip" onClick={()=>setImageYPercent(p=>Math.max(5,p-5))}>↑</button>
                        <button type="button" className="chip" onClick={()=>setImageYPercent(p=>Math.min(95,p+5))}>↓</button>
                        <button type="button" className="chip" onClick={()=>{setImageXPercent(50);setImageYPercent(50);}}>Centrer</button>
                      </div>
                      <div className="form-group" style={{marginTop:8}}>
                        <div className="options-row">
                          <button type="button" className="chip" onClick={()=>setImageFlipX(f=>!f)}>{imageFlipX?'Annuler flip':'Flip horizontal'}</button>
                          <button type="button" className="chip" onClick={()=>setImageZIndex(z=>Math.max(1,z-1))}>Arrière-plan</button>
                          <button type="button" className="chip" onClick={()=>setImageZIndex(z=>Math.min(10,z+1))}>Premier plan</button>
                        </div>
                        <small style={{color:'var(--cz-text-muted)'}}>z-index: {imageZIndex} • face: {imageSide}</small>
                      </div>
                    </>)}
                  </div>
                  {/* Reset / Delete */}
                  <div className="form-group">
                    <div className="options-row">
                      <button type="button" className="chip" onClick={()=>{setImageXPercent(50);setImageYPercent(50);setImageScale(1);setImageRotation(0);setImageOpacity(1);setImageFlipX(false);setImageZIndex(2);setImageSide('front');}}>Réinitialiser</button>
                      <button type="button" className="chip" onClick={()=>{if(uploadedImageUrl?.startsWith('blob:'))try{URL.revokeObjectURL(uploadedImageUrl);}catch(_){}setUploadedImageUrl('');}}>Supprimer l'image</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TEXTE */}
            {activeContextSection==='texte' && (
              <div ref={texteRef} className="panel open" role="region" aria-label="Ajouter un texte">
                <div className="panel-content" onClick={e=>e.stopPropagation()}>
                  <div className="form-group">
                    <button type="button" className="chip" onClick={addTextLayer}>Ajouter un texte</button>
                    <div className="options-row" style={{marginTop:'0.5rem'}}>
                      <label>Limite caractères</label>
                      <input type="number" min="1" max="200" value={textCharLimit} onChange={e=>setTextCharLimit(Number(e.target.value)||50)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Zones de texte</label>
                    <div className="layers-list">
                      {textLayers.length===0&&<p style={{color:'var(--cz-text-muted)'}}>Aucun texte ajouté.</p>}
                      {textLayers.map((t,idx)=>(
                        <div key={t.id} className={`layer-item ${selectedTextId===t.id?'active':''}`}>
                          <div className="layer-row">
                            <button type="button" className="chip" onClick={()=>setSelectedTextId(t.id)}>{t.name||`Texte ${idx+1}`}</button>
                            <input type="text" value={t.name||''} onChange={e=>renameTextLayer(t.id,e.target.value)} placeholder={`Texte ${idx+1}`} style={{marginLeft:'0.5rem'}} />
                          </div>
                          <div className="layer-actions">
                            <label className="chip"><input type="checkbox" checked={t.visible??true} onChange={()=>toggleVisibilityTextLayer(t.id)} /> Visible</label>
                            <button type="button" className={`chip ${t.locked?'active':''}`} onClick={()=>toggleLockTextLayer(t.id)}>{t.locked?'Déverrouiller':'Verrouiller'}</button>
                            <button type="button" className="chip" onClick={()=>moveTextLayerUp(t.id)}>Monter</button>
                            <button type="button" className="chip" onClick={()=>moveTextLayerDown(t.id)}>Descendre</button>
                            <button type="button" className="chip" onClick={()=>bringTextLayerToFront(t.id)}>Premier plan</button>
                            <button type="button" className="chip" onClick={()=>sendTextLayerToBack(t.id)}>Arrière-plan</button>
                            <button type="button" className="chip" onClick={()=>updateTextLayer(t.id,{side:t.side==='front'?'back':'front'},'Basculer face')}>{t.side==='front'?'→ Arrière':'→ Avant'}</button>
                            <button type="button" className="chip" onClick={()=>duplicateTextLayer(t.id)}>Dupliquer</button>
                            <button type="button" className="chip" onClick={()=>deleteTextLayer(t.id)} style={{color:'var(--cz-text-error,#ef4444)'}}>Supprimer</button>
                          </div>
                          <small style={{color:'var(--cz-text-muted)'}}>z-index: {t.zIndex} • face: {t.side}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedTextId && (() => {
                    const t = textLayers.find(x=>x.id===selectedTextId);
                    if (!t) return null;
                    return (<>
                      <div className="form-group">
                        <label>Contenu</label>
                        <input type="text" maxLength={textCharLimit} value={t.content||''} onChange={e=>updateTextLayer(selectedTextId,{content:e.target.value})} />
                        <small style={{color:'var(--cz-text-muted)'}}>{t.content?.length||0} / {textCharLimit}</small>
                      </div>
                      <div className="form-group"><label>Couleur</label><input type="color" value={t.color||'#111827'} onChange={e=>updateTextLayer(selectedTextId,{color:e.target.value})} /></div>
                      <div className="form-group">
                        <label>Police</label>
                        <select value={t.fontFamily||'Arial, Helvetica, sans-serif'} onChange={e=>updateTextLayer(selectedTextId,{fontFamily:e.target.value})}>
                          <option value="Arial, Helvetica, sans-serif">Arial</option>
                          <option value="'Times New Roman', Times, serif">Times New Roman</option>
                          <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                          <option value="Montserrat, Arial, sans-serif">Montserrat</option>
                          <option value="Roboto, Arial, sans-serif">Roboto</option>
                          <option value="'Open Sans', Arial, sans-serif">Open Sans</option>
                          <option value="Courier New, monospace">Courier New</option>
                        </select>
                      </div>
                      <div className="form-group"><label>Taille</label><input type="range" min="8" max="200" step="1" value={t.fontSize||32} onChange={e=>updateTextLayer(selectedTextId,{fontSize:Number(e.target.value)})} /></div>
                      <div className="options-row">
                        <button className={`chip ${t.fontWeight===700?'active':''}`} onClick={()=>updateTextLayer(selectedTextId,{fontWeight:t.fontWeight===700?400:700})}>Gras</button>
                        <button className={`chip ${t.fontStyle==='italic'?'active':''}`} onClick={()=>updateTextLayer(selectedTextId,{fontStyle:t.fontStyle==='italic'?'normal':'italic'})}>Italique</button>
                        <button className={`chip ${t.textDecoration==='underline'?'active':''}`} onClick={()=>updateTextLayer(selectedTextId,{textDecoration:t.textDecoration==='underline'?'none':'underline'})}>Souligné</button>
                      </div>
                      <div className="form-group">
                        <label>Espacement lettres</label>
                        <input type="range" min="-2" max="10" step="0.5" value={t.letterSpacing||0} onChange={e=>updateTextLayer(selectedTextId,{letterSpacing:Number(e.target.value)})} />
                      </div>
                      <div className="form-group">
                        <label>Opacité</label>
                        <input type="range" min="0" max="100" step="1" value={Math.round((t.opacity||1)*100)} onChange={e=>updateTextLayer(selectedTextId,{opacity:Number(e.target.value)/100})} />
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
                        <label>Rotation</label>
                        <input type="range" min="-180" max="180" step="1" value={t.rotation||0} onChange={e=>updateTextLayer(selectedTextId,{rotation:Number(e.target.value)})} />
                        <div className="options-row">
                          {[0,45,90].map(a=><button key={a} className="chip" onClick={()=>rotateTextTo(selectedTextId,a)}>{a}°</button>)}
                        </div>
                      </div>
                      <div className="form-group"><label>Échelle</label><input type="range" min="0.5" max="3" step="0.05" value={t.scale||1} onChange={e=>updateTextLayer(selectedTextId,{scale:Number(e.target.value)})} /></div>
                      <div className="form-group">
                        <label>Fond du texte</label>
                        <div className="options-row">
                          <label><input type="checkbox" checked={t.backgroundEnabled||false} onChange={e=>updateTextLayer(selectedTextId,{backgroundEnabled:e.target.checked})} /> Activer</label>
                          <input type="color" disabled={!t.backgroundEnabled} value={t.backgroundColor||'#ffffff'} onChange={e=>updateTextLayer(selectedTextId,{backgroundColor:e.target.value})} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Ombre</label>
                        <div className="options-row">
                          <label><input type="checkbox" checked={t.shadowEnabled||false} onChange={e=>updateTextLayer(selectedTextId,{shadowEnabled:e.target.checked})} /> Activer</label>
                          <input type="color" disabled={!t.shadowEnabled} value={t.shadowColor||'rgba(0,0,0,0.3)'} onChange={e=>updateTextLayer(selectedTextId,{shadowColor:e.target.value})} />
                        </div>
                      </div>
                    </>);
                  })()}
                </div>
              </div>
            )}

            {/* SAVE */}
            {activeContextSection==='save' && (
              <div className="panel open" ref={saveRef} role="region" aria-label="Sauvegarde">
                <h3 className="cz-panel-title">Sauvegarde</h3>
                <div className="save-panel">

                  {hasAutoDraft && (
                    <div className="save-draft-alert">
                      <span>💾 Un brouillon automatique est disponible.</span>
                      <button className="save-btn save-btn-outline" onClick={loadAutoDraft}>Reprendre le brouillon</button>
                    </div>
                  )}

                  <div className="save-name-row">
                    <input type="text" className="save-name-input" placeholder="Nom de la sauvegarde" value={savedName} onChange={e=>setSavedName(e.target.value)} />
                    <button className="save-btn save-btn-outline" onClick={exportCustomizationFile}>Exporter JSON</button>
                    <label className="save-btn save-btn-outline" style={{cursor:'pointer'}}>
                      Importer JSON
                      <input type="file" accept="application/json" className="save-file-input" onChange={importCustomizationFile} />
                    </label>
                  </div>

                  <div className="save-options-row">
                    <span className="save-options-label">Résolution</span>
                    <select className="save-select" value={previewSize} onChange={e=>setPreviewSize(Number(e.target.value))}>
                      <option value={1024}>1024 px</option>
                      <option value={2048}>2048 px</option>
                      <option value={4096}>4096 px</option>
                    </select>
                    <label className="save-checkbox-label">
                      <input type="checkbox" checked={includeGuides} onChange={e=>setIncludeGuides(e.target.checked)} />
                      Inclure les guides
                    </label>
                  </div>

                  <div className="save-actions">
                    <button className="save-btn save-btn-primary"  onClick={saveCustomizationLocal}>💾 Enregistrer</button>
                    <button className="save-btn save-btn-outline"  onClick={loadCustomizationLocal}>📂 Charger</button>
                    <button className="save-btn save-btn-outline"  onClick={generateShareLink}>🔗 Copier le lien</button>
                    <button className="save-btn save-btn-ghost"    onClick={downloadPreviewImage}>⬇ Télécharger l'aperçu</button>
                  </div>

                  <div className="save-divider" />

                  <div className="save-online-block">
                    <p className="save-online-title">Sauvegarde en ligne</p>
                    <div className="save-actions">
                      <button className="save-btn save-btn-primary" onClick={saveCustomizationServer}>☁️ Enregistrer sur le compte</button>
                    </div>
                    <div className="save-server-id-row">
                      <input type="text" className="save-name-input" value={serverLoadId} onChange={e=>setServerLoadId(e.target.value)} placeholder="ID de la création (serveur)" />
                      <button className="save-btn save-btn-outline" onClick={()=>loadCustomizationServerById(serverLoadId)}>Charger</button>
                    </div>
                    <p className="save-server-hint">💡 L'ID est copié automatiquement après l'enregistrement.</p>
                  </div>

                  {savedList.length>0 && (
                    <div>
                      <p className="save-list-title">Vos sauvegardes ({savedList.length})</p>
                      <ul className="save-list">
                        {savedList.map(s=>(
                          <li key={s.id} className="save-list-item">
                            <div className="save-list-name">
                              <span className="save-list-name-text">{s.name}</span>
                              <span className="save-list-date">{new Date(s.timestamp).toLocaleString()}</span>
                              {s.serverId&&<span className="save-list-server-id">ID: {s.serverId}</span>}
                            </div>
                            <div className="save-list-actions">
                              <button className="save-btn save-btn-outline" onClick={()=>loadSavedById(s.id)}>Charger</button>
                              <button className="save-btn save-btn-outline" onClick={()=>{const nn=window.prompt('Nouveau nom',s.name);if(nn!==null)renameSavedById(s.id,nn);}}>Renommer</button>
                              <button className="save-btn save-btn-danger"  onClick={()=>deleteSavedById(s.id)}>✕</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="save-divider" />

                  <div>
                    <p className="save-history-title">Historique des actions</p>
                    <div className="save-actions">
                      <button className="save-btn save-btn-outline" onClick={undo}>↩ Annuler (Ctrl+Z)</button>
                      <button className="save-btn save-btn-outline" onClick={redo}>↪ Rétablir (Ctrl+Y)</button>
                    </div>
                    {historyActions.length>0&&(
                      <ul className="save-history-list">
                        {historyActions.slice(-10).map((h,i)=><li key={i}>{h}</li>)}
                      </ul>
                    )}
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── PREVIEW ── */}
        <div className="customize-preview">
          <div className="preview-toolbar">
            <div className="options-row">
              <button className={`chip ${!showBack?'active':''}`} onClick={()=>setShowBack(false)}>Avant</button>
              <button className={`chip ${showBack?'active':''}`}  onClick={()=>setShowBack(true)}>Arrière</button>
              <button className={`chip ${previewMode?'active':''}`} onClick={()=>setPreviewMode(v=>!v)}>{previewMode?'Mode édition':'Mode aperçu'}</button>
              <div className="zoom-controls">
                <span>Zoom</span>
                <input type="range" min="0.5" max="3" step="0.05" value={canvasZoom} onChange={e=>setCanvasZoom(Number(e.target.value))} />
                <span>{Math.round(canvasZoom*100)}%</span>
              </div>
              <div className="unit-controls">
                <span>Règles</span>
                <select value={rulerUnit} onChange={e=>setRulerUnit(e.target.value)}>
                  <option value="px">px</option>
                  <option value="cm">cm</option>
                </select>
              </div>
              {!previewMode&&(
                <div className="guide-controls">
                  <button className="chip" onClick={()=>addGuideLine('vertical')}>Repère V</button>
                  <button className="chip" onClick={()=>addGuideLine('horizontal')}>Repère H</button>
                </div>
              )}
            </div>
          </div>

          <PreviewCanvas
            showBack={showBack} selectedModel={selectedModel} selectedColor={selectedColor}
            uploadedImageUrl={uploadedImageUrl}
            imageXPercent={imageXPercent} imageYPercent={imageYPercent}
            imageScale={imageScale} imageRotation={imageRotation}
            imageVisible={imageVisible} imageLocked={imageLocked}
            imageOpacity={imageOpacity} imageFlipX={imageFlipX}
            imageZIndex={imageZIndex} imageSide={imageSide}
            setImageXPercent={setImageXPercent} setImageYPercent={setImageYPercent} setImageRotation={setImageRotation}
            canvasRef={canvasRef}
            textLayers={textLayers} selectedTextId={selectedTextId}
            setSelectedTextId={setSelectedTextId} updateTextLayer={updateTextLayer}
            editingTextId={editingTextId} setEditingTextId={setEditingTextId}
            previewMode={previewMode} canvasZoom={canvasZoom} rulerUnit={rulerUnit}
            guideLines={guideLines} updateGuideLine={updateGuideLine} deleteGuideLine={deleteGuideLine}
          />
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="preview-sidebar-right">
          {/* Gallery */}
          <div className="panel">
            <h3>Galerie d'images</h3>
            <div className="image-gallery">
              {selectedModel?.images&&(
                <div className="gallery-section">
                  <h4>Images par défaut</h4>
                  <div className="gallery-grid">
                    {selectedModel.images.front&&<div className="gallery-thumb" onClick={()=>setShowBack(false)}><img src={selectedModel.images.front} alt="Avant" /><span>Avant</span></div>}
                    {selectedModel.images.back&&<div className="gallery-thumb" onClick={()=>setShowBack(true)}><img src={selectedModel.images.back} alt="Arrière" /><span>Arrière</span></div>}
                  </div>
                </div>
              )}
              {selectedModel?.imagesByColor&&Object.keys(selectedModel.imagesByColor).length>0&&(
                <div className="gallery-section">
                  <h4>Images par couleur</h4>
                  {(()=>{
                    const imgs=selectedModel.imagesByColor[selectedColor];
                    if(!imgs||(!imgs.front&&!imgs.back)) return <p style={{color:'var(--cz-text-muted)'}}>Aucune image pour "{selectedColor}".</p>;
                    return (<div className="color-gallery">
                      <h5>{selectedColor}</h5>
                      <div className="gallery-grid">
                        {imgs.front&&<div className="gallery-thumb" onClick={()=>setShowBack(false)}><img src={imgs.front} alt={`${selectedColor} avant`} /><span>Avant</span></div>}
                        {imgs.back&&<div className="gallery-thumb" onClick={()=>setShowBack(true)}><img src={imgs.back} alt={`${selectedColor} arrière`} /><span>Arrière</span></div>}
                      </div>
                    </div>);
                  })()}
                </div>
              )}
            </div>
          </div>

          <CustomizationPricing />
          <CustomizationSelector
            baseModelPrice={Number(selectedModel?.basePrice)||Number(DEFAULT_MODEL_PLACEHOLDER.basePrice)}
            selection={{
              text:  { front:Array.isArray(textLayers)&&textLayers.some(t=>t?.side==='front'&&(t?.visible??true)), back:Array.isArray(textLayers)&&textLayers.some(t=>t?.side==='back'&&(t?.visible??true)) },
              image: { front:Boolean(uploadedImageUrl&&imageVisible&&imageSide==='front'), back:Boolean(uploadedImageUrl&&imageVisible&&imageSide==='back') },
            }}
            onTotals={t=>setComputedTotals(t)}
          />

          {/* Techniques */}
          <div className="panel">
            <h3>Techniques d'impression</h3>
            <div className="options-row">
              {['DTF','Numérique','DTG','Sublimation'].map(tech=>(
                <button key={tech} className={`chip ${selectedTechnique===tech?'active':''}`} onClick={()=>setSelectedTechnique(tech)}>{tech}</button>
              ))}
            </div>
            <p style={{color:'var(--cz-text-muted)',fontSize:'0.82rem',marginTop:'0.5rem'}}>Aperçu et coûts seront ajoutés ici.</p>
          </div>

          {/* Actions */}
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

        {/* ── MOBILE TOOL PANEL (slide up above tab bar) ── */}
        <div
          className={`cz-mobile-tool-panel ${sheetOpen && isMobile ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={
            activeContextSection === 'produit' ? 'Filtrer les modèles' :
            activeContextSection === 'image'   ? 'Ajouter une image'   :
            activeContextSection === 'texte'   ? 'Ajouter un texte'    :
            activeContextSection === 'save'    ? 'Sauvegarde'          : ''
          }
        >
          {/* Drag handle */}
          <div className="cz-mobile-tool-panel-handle" />

          {/* Header */}
          <div className="cz-mobile-tool-panel-header">
            <p className="cz-mobile-tool-panel-title">
              {activeContextSection === 'produit' ? 'Filtrer les modèles' :
               activeContextSection === 'image'   ? 'Ajouter une image'   :
               activeContextSection === 'texte'   ? 'Ajouter un texte'    :
               activeContextSection === 'save'    ? 'Sauvegarde'          : ''}
            </p>
            <button
              type="button"
              className="cz-mobile-tool-panel-close"
              onClick={() => { setSheetOpen(false); setActiveContextSection(null); }}
              aria-label="Fermer"
            >×</button>
          </div>

          {/* Scrollable body */}
          <div className="cz-mobile-tool-panel-body">

            {activeContextSection === 'produit' && (
              <div className="panel-content" onClick={e => e.stopPropagation()}>
                <div className="form-group">
                  <label>Modèle</label>
                  <select value={selectedModel?._id||''} onChange={e=>handleModelChange(e.target.value)}>
                    {activeModels.map(m=><option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Prix du modèle</label>
                  <div className="model-price-inline">
                    {Number.isFinite(Number(selectedModel?.basePrice))?`${Number(selectedModel.basePrice).toFixed(2)} €`:`${Number(DEFAULT_MODEL_PLACEHOLDER.basePrice).toFixed(2)} €`}
                  </div>
                </div>
                <div className="form-group">
                  <label>Couleur</label>
                  <div className="options-row">
                    {availableColors.map(color=>(
                      <button key={color} className={`chip color-chip ${selectedColor===color?'active':''}`} onClick={()=>setSelectedColor(color)}>
                        <div className="color-swatch" style={{backgroundColor:color.toLowerCase()}} />{color}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Tailles</label>
                  <div className="options-row">
                    {availableSizes.map(size=>(
                      <button key={size} type="button" className={`chip ${selectedSize===size?'active':''}`} onClick={()=>setSelectedSize(size)}>{size}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeContextSection === 'image' && (
              <div className="panel-content" onClick={e => e.stopPropagation()}>
                <div className="form-group">
                  <label role="button" tabIndex={0} onClick={()=>setImageUploaderOpen(o=>!o)} style={toggleLabelStyle(imageUploaderOpen)}>
                    Uploader une image (PNG/JPG/SVG)
                  </label>
                  {imageUploaderOpen&&(<>
                    <input type="file" accept="image/*,.svg" onChange={handleFileUpload} />
                    <div className="quick-actions" style={{marginTop:8}}>
                      <button className="chip" onClick={nudgeImageRight}>Déplacer à droite</button>
                      <button className="chip" onClick={alignImageRight}>Aligner à droite</button>
                      <button className="chip" disabled={!uploadedImageUrl||bgRemoving} onClick={handleRemoveBackground}>{bgRemoving?'Suppression…':'Supprimer le fond'}</button>
                    </div>
                  </>)}
                </div>
                <div className="form-group">
                  <label role="button" tabIndex={0} onClick={()=>setImageSizeOpen(o=>!o)} style={toggleLabelStyle(imageSizeOpen)}>Taille</label>
                  {imageSizeOpen&&<input type="range" min="0.2" max="3" step="0.05" value={imageScale} onChange={e=>setImageScale(Number(e.target.value))} />}
                </div>
                <div className="form-group">
                  <label role="button" tabIndex={0} onClick={()=>setImageRotationOpen(o=>!o)} style={toggleLabelStyle(imageRotationOpen)}>Rotation</label>
                  {imageRotationOpen&&<input type="range" min="-180" max="180" step="1" value={imageRotation} onChange={e=>setImageRotation(Number(e.target.value))} />}
                </div>
                <div className="form-group">
                  <label role="button" tabIndex={0} onClick={()=>setImageVisibilityOpen(o=>!o)} style={toggleLabelStyle(imageVisibilityOpen)}>Visible</label>
                  {imageVisibilityOpen&&(
                    <div className="options-row">
                      <label className="chip"><input type="checkbox" checked={imageVisible} onChange={()=>setImageVisible(v=>!v)} /> Visible</label>
                      <button type="button" className={`chip ${imageLocked?'active':''}`} onClick={()=>setImageLocked(v=>!v)}>{imageLocked?'Déverrouiller':'Verrouiller'}</button>
                      <button type="button" className="chip" onClick={()=>setImageSide(s=>s==='front'?'back':'front')}>{imageSide==='front'?'Envoyer à arrière':'Envoyer à avant'}</button>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label role="button" tabIndex={0} onClick={()=>setImageOpacityOpen(o=>!o)} style={toggleLabelStyle(imageOpacityOpen)}>Opacité</label>
                  {imageOpacityOpen&&<input type="range" min="0" max="1" step="0.05" value={imageOpacity} onChange={e=>setImageOpacity(Number(e.target.value))} />}
                </div>
                <div className="form-group">
                  <label role="button" tabIndex={0} onClick={()=>setImagePositionOpen(o=>!o)} style={toggleLabelStyle(imagePositionOpen)}>Position</label>
                  {imagePositionOpen&&(<>
                    <div className="options-row">
                      <button type="button" className="chip" onClick={()=>setImageXPercent(p=>Math.max(5,p-5))}>←</button>
                      <button type="button" className="chip" onClick={()=>setImageXPercent(p=>Math.min(95,p+5))}>→</button>
                      <button type="button" className="chip" onClick={()=>setImageYPercent(p=>Math.max(5,p-5))}>↑</button>
                      <button type="button" className="chip" onClick={()=>setImageYPercent(p=>Math.min(95,p+5))}>↓</button>
                      <button type="button" className="chip" onClick={()=>{setImageXPercent(50);setImageYPercent(50);}}>Centrer</button>
                    </div>
                    <div className="options-row" style={{marginTop:8}}>
                      <button type="button" className="chip" onClick={()=>setImageFlipX(f=>!f)}>{imageFlipX?'Annuler flip':'Flip H'}</button>
                      <button type="button" className="chip" onClick={()=>setImageZIndex(z=>Math.max(1,z-1))}>Arrière</button>
                      <button type="button" className="chip" onClick={()=>setImageZIndex(z=>Math.min(10,z+1))}>Premier plan</button>
                    </div>
                  </>)}
                </div>
                <div className="form-group">
                  <div className="options-row">
                    <button type="button" className="chip" onClick={()=>{setImageXPercent(50);setImageYPercent(50);setImageScale(1);setImageRotation(0);setImageOpacity(1);setImageFlipX(false);setImageZIndex(2);setImageSide('front');}}>Réinitialiser</button>
                    <button type="button" className="chip" onClick={()=>{if(uploadedImageUrl?.startsWith('blob:'))try{URL.revokeObjectURL(uploadedImageUrl);}catch(_){}setUploadedImageUrl('');}}>Supprimer l'image</button>
                  </div>
                </div>
              </div>
            )}

            {activeContextSection === 'texte' && (
              <div className="panel-content" onClick={e => e.stopPropagation()}>
                <div className="form-group">
                  <button type="button" className="chip" onClick={addTextLayer}>+ Ajouter un texte</button>
                </div>
                <div className="form-group">
                  <label>Zones de texte</label>
                  <div className="layers-list">
                    {textLayers.length===0&&<p style={{color:'var(--cz-text-muted)'}}>Aucun texte ajouté.</p>}
                    {textLayers.map((t,idx)=>(
                      <div key={t.id} className={`layer-item ${selectedTextId===t.id?'active':''}`}>
                        <div className="layer-row">
                          <button type="button" className="chip" onClick={()=>setSelectedTextId(t.id)}>{t.name||`Texte ${idx+1}`}</button>
                        </div>
                        <div className="layer-actions">
                          <label className="chip"><input type="checkbox" checked={t.visible??true} onChange={()=>toggleVisibilityTextLayer(t.id)} /> Visible</label>
                          <button type="button" className={`chip ${t.locked?'active':''}`} onClick={()=>toggleLockTextLayer(t.id)}>{t.locked?'Déverr.':'Verr.'}</button>
                          <button type="button" className="chip" onClick={()=>duplicateTextLayer(t.id)}>Dupliquer</button>
                          <button type="button" className="chip" onClick={()=>deleteTextLayer(t.id)} style={{color:'var(--cz-text-error,#ef4444)'}}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedTextId && (() => {
                  const t = textLayers.find(x=>x.id===selectedTextId);
                  if (!t) return null;
                  return (<>
                    <div className="form-group">
                      <label>Contenu</label>
                      <input type="text" maxLength={textCharLimit} value={t.content||''} onChange={e=>updateTextLayer(selectedTextId,{content:e.target.value})} />
                    </div>
                    <div className="form-group"><label>Couleur</label><input type="color" value={t.color||'#111827'} onChange={e=>updateTextLayer(selectedTextId,{color:e.target.value})} /></div>
                    <div className="form-group">
                      <label>Police</label>
                      <select value={t.fontFamily||'Arial, Helvetica, sans-serif'} onChange={e=>updateTextLayer(selectedTextId,{fontFamily:e.target.value})}>
                        <option value="Arial, Helvetica, sans-serif">Arial</option>
                        <option value="'Times New Roman', Times, serif">Times New Roman</option>
                        <option value="Montserrat, Arial, sans-serif">Montserrat</option>
                        <option value="Roboto, Arial, sans-serif">Roboto</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Taille</label><input type="range" min="8" max="200" step="1" value={t.fontSize||32} onChange={e=>updateTextLayer(selectedTextId,{fontSize:Number(e.target.value)})} /></div>
                    <div className="options-row">
                      <button className={`chip ${t.fontWeight===700?'active':''}`} onClick={()=>updateTextLayer(selectedTextId,{fontWeight:t.fontWeight===700?400:700})}>Gras</button>
                      <button className={`chip ${t.fontStyle==='italic'?'active':''}`} onClick={()=>updateTextLayer(selectedTextId,{fontStyle:t.fontStyle==='italic'?'normal':'italic'})}>Italique</button>
                      <button className={`chip ${t.textDecoration==='underline'?'active':''}`} onClick={()=>updateTextLayer(selectedTextId,{textDecoration:t.textDecoration==='underline'?'none':'underline'})}>Souligné</button>
                    </div>
                    <div className="form-group"><label>Rotation</label><input type="range" min="-180" max="180" step="1" value={t.rotation||0} onChange={e=>updateTextLayer(selectedTextId,{rotation:Number(e.target.value)})} /></div>
                  </>);
                })()}
              </div>
            )}

            {activeContextSection === 'save' && (
              <div className="save-panel">
                {hasAutoDraft && (
                  <div className="save-draft-alert">
                    <span>💾 Brouillon disponible.</span>
                    <button className="save-btn save-btn-outline" onClick={loadAutoDraft}>Reprendre</button>
                  </div>
                )}
                <div className="save-name-row">
                  <input type="text" className="save-name-input" placeholder="Nom de la sauvegarde" value={savedName} onChange={e=>setSavedName(e.target.value)} />
                </div>
                <div className="save-actions">
                  <button className="save-btn save-btn-primary"  onClick={saveCustomizationLocal}>💾 Enregistrer</button>
                  <button className="save-btn save-btn-outline"  onClick={loadCustomizationLocal}>📂 Charger</button>
                  <button className="save-btn save-btn-outline"  onClick={generateShareLink}>🔗 Lien</button>
                  <button className="save-btn save-btn-ghost"    onClick={downloadPreviewImage}>⬇ Aperçu</button>
                  <button className="save-btn save-btn-primary"  onClick={saveCustomizationServer}>☁️ En ligne</button>
                </div>
                <div className="save-actions" style={{marginTop:'0.5rem'}}>
                  <button className="save-btn save-btn-outline" onClick={undo}>↩ Annuler</button>
                  <button className="save-btn save-btn-outline" onClick={redo}>↪ Rétablir</button>
                </div>
                {savedList.length > 0 && (
                  <div style={{marginTop:'0.75rem'}}>
                    <p className="save-list-title">Sauvegardes ({savedList.length})</p>
                    <ul className="save-list">
                      {savedList.slice(0, 5).map(s=>(
                        <li key={s.id} className="save-list-item">
                          <div className="save-list-name">
                            <span className="save-list-name-text">{s.name}</span>
                            <span className="save-list-date">{new Date(s.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="save-list-actions">
                            <button className="save-btn save-btn-outline" onClick={()=>loadSavedById(s.id)}>Charger</button>
                            <button className="save-btn save-btn-danger"  onClick={()=>deleteSavedById(s.id)}>✕</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          
          </div>
        </div>

      </div>
    </div>
  );
};

export default Customize;

/* ================================================================
   PreviewCanvas — memoized
   ================================================================ */
const PreviewCanvas = React.memo(({
  showBack, selectedModel, selectedColor, uploadedImageUrl,
  imageXPercent, imageYPercent, imageScale, imageRotation,
  imageVisible, imageLocked, imageOpacity, imageFlipX, imageZIndex, imageSide,
  setImageXPercent, setImageYPercent, setImageRotation,
  canvasRef, textLayers, selectedTextId, setSelectedTextId, updateTextLayer,
  editingTextId, setEditingTextId, previewMode, canvasZoom, rulerUnit,
  guideLines, updateGuideLine, deleteGuideLine,
}) => {
  const colorImages  = selectedModel?.imagesByColor?.[selectedColor];
  const defaultImages= selectedModel?.images;
  const baseSrc = showBack
    ? (colorImages?.back  || defaultImages?.back  || DEFAULT_MODEL_PLACEHOLDER.images.back)
    : (colorImages?.front || defaultImages?.front || DEFAULT_MODEL_PLACEHOLDER.images.front);

  const dragState   = React.useRef(null);
  const rotateState = React.useRef(null);
  const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

  const onImagePointerDown = (e) => {
    if (imageLocked) return; e.stopPropagation();
    const rect=canvasRef.current?.getBoundingClientRect(); if(!rect) return;
    const sx=e.clientX,sy=e.clientY,ox=imageXPercent,oy=imageYPercent;
    const onMove=(ev)=>{setImageXPercent(clamp(ox+(ev.clientX-sx)/rect.width*100,5,95));setImageYPercent(clamp(oy+(ev.clientY-sy)/rect.height*100,5,95));};
    const onUp=()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);};
    window.addEventListener('pointermove',onMove); window.addEventListener('pointerup',onUp);
  };

  const onImageRotatePointerDown = (e) => {
    if (imageLocked) return; e.stopPropagation();
    const rect=canvasRef.current?.getBoundingClientRect(); if(!rect) return;
    const cx=rect.left+(imageXPercent/100)*rect.width, cy=rect.top+(imageYPercent/100)*rect.height;
    const onMove=(ev)=>{
      let angle=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI;
      if(ev.shiftKey){const snaps=[-180,-135,-90,-45,0,45,90,135,180];angle=snaps.reduce((p,c)=>Math.abs(c-angle)<Math.abs(p-angle)?c:p,0);}
      setImageRotation(angle);
    };
    const onUp=()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);};
    window.addEventListener('pointermove',onMove); window.addEventListener('pointerup',onUp);
  };

  const onLayerPointerDown = (t,e) => {
    if(t.locked) return; e.stopPropagation();
    const rect=canvasRef.current?.getBoundingClientRect(); if(!rect) return;
    setSelectedTextId(t.id);
    const sx=e.clientX,sy=e.clientY,ox=t.xPercent,oy=t.yPercent;
    dragState.current={id:t.id};
    const onMove=(ev)=>{updateTextLayer(t.id,{xPercent:Math.max(5,Math.min(95,ox+(ev.clientX-sx)/rect.width*100)),yPercent:Math.max(5,Math.min(95,oy+(ev.clientY-sy)/rect.height*100))});};
    const onUp=()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);dragState.current=null;};
    window.addEventListener('pointermove',onMove); window.addEventListener('pointerup',onUp);
  };

  const onRotatePointerDown = (t,e) => {
    if(t.locked) return; e.stopPropagation();
    const rect=canvasRef.current?.getBoundingClientRect(); if(!rect) return;
    const cx=rect.left+(t.xPercent/100)*rect.width, cy=rect.top+(t.yPercent/100)*rect.height;
    const onMove=(ev)=>{
      let angle=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI;
      if(ev.shiftKey){const snaps=[-180,-135,-90,-45,0,45,90,135,180];angle=snaps.reduce((p,c)=>Math.abs(c-angle)<Math.abs(p-angle)?c:p,0);}
      updateTextLayer(t.id,{rotation:angle});
    };
    const onUp=()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);};
    window.addEventListener('pointermove',onMove); window.addEventListener('pointerup',onUp);
  };

  const onEditInput = (t,e) => updateTextLayer(t.id,{content:(e.currentTarget.textContent||'').slice(0,200)});

  const selected    = selectedTextId ? textLayers.find(x=>x.id===selectedTextId) : null;
  const nearCenterX = selected ? Math.abs((selected.xPercent??0)-50)<1 : false;
  const nearCenterY = selected ? Math.abs((selected.yPercent??0)-50)<1 : false;

  const PX_PER_CM=37.795;
  const canvasW=canvasRef.current?.clientWidth||0;
  const canvasH=canvasRef.current?.clientHeight||0;
  const minorStep=rulerUnit==='cm'?PX_PER_CM*0.5:50;
  const majorStep=rulerUnit==='cm'?PX_PER_CM:100;
  const xTicks=Array.from({length:Math.max(1,Math.floor(canvasW/minorStep)+1)},(_,i)=>Math.round(i*minorStep));
  const yTicks=Array.from({length:Math.max(1,Math.floor(canvasH/minorStep)+1)},(_,i)=>Math.round(i*minorStep));

  const onGuidePointerDown = (g,e) => {
    e.stopPropagation();
    const rect=canvasRef.current?.getBoundingClientRect(); if(!rect) return;
    const sx=e.clientX,sy=e.clientY,orig=g.percent;
    const onMove=(ev)=>{
      if(g.type==='vertical') updateGuideLine(g.id,{percent:Math.max(0,Math.min(100,orig+(ev.clientX-sx)/rect.width*100))});
      else updateGuideLine(g.id,{percent:Math.max(0,Math.min(100,orig+(ev.clientY-sy)/rect.height*100))});
    };
    const onUp=()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);};
    window.addEventListener('pointermove',onMove); window.addEventListener('pointerup',onUp);
  };

  return (
    <div
      className={`canvas-container ${previewMode?'preview-mode':''}`}
      ref={canvasRef}
      onPointerDown={()=>setEditingTextId(null)}
      style={{transform:`scale(${canvasZoom})`,transformOrigin:'center center'}}
    >
      <img className="product-base" src={baseSrc} alt="Base produit" />

      {uploadedImageUrl&&(showBack?imageSide==='back':imageSide==='front')&&imageVisible&&(<>
        <img
          src={uploadedImageUrl} alt="Upload" className="uploaded-image"
          style={{left:`${imageXPercent}%`,top:`${imageYPercent}%`,transform:`translate(-50%,-50%) scale(${imageFlipX?-imageScale:imageScale},${imageScale}) rotate(${imageRotation}deg)`,width:'50%',zIndex:imageZIndex,opacity:imageOpacity}}
          onPointerDown={onImagePointerDown}
        />
        {!previewMode&&!imageLocked&&(
          <div className="rotate-handle" style={{left:`${imageXPercent}%`,top:`calc(${imageYPercent}% - 24px)`}} onPointerDown={onImageRotatePointerDown} />
        )}
      </>)}

      {textLayers?.filter(t=>(showBack?t.side==='back':t.side==='front')&&(t.visible??true)).map(t=>(
        <div
          key={t.id}
          className={`text-layer ${!previewMode&&selectedTextId===t.id?'selected':''} ${t.locked?'locked':''}`}
          style={{left:`${t.xPercent}%`,top:`${t.yPercent}%`,transform:`translate(-50%,-50%) rotate(${t.rotation||0}deg) scale(${t.scale||1})`,opacity:t.opacity??1,zIndex:t.zIndex??3}}
          onPointerDown={e=>onLayerPointerDown(t,e)}
          onDoubleClick={e=>{if(!t.locked){setSelectedTextId(t.id);setEditingTextId(t.id);}}}
        >
          <div
            className="text-box"
            style={{fontFamily:t.fontFamily||'Arial',fontSize:`${t.fontSize||32}px`,fontWeight:t.fontWeight||400,fontStyle:t.fontStyle||'normal',letterSpacing:`${t.letterSpacing||0}px`,lineHeight:t.lineHeight||1.2,color:t.color||'#111827',textDecoration:t.textDecoration||'none',background:t.backgroundEnabled?(t.backgroundColor||'#fff'):'transparent',padding:t.backgroundEnabled?`${t.padding||4}px`:'0px',border:t.borderEnabled?`${t.borderWidth||1}px ${t.borderStyle||'solid'} ${t.borderColor||'#000'}`:'none',boxShadow:t.shadowEnabled?`${t.shadowX||0}px ${t.shadowY||0}px ${t.shadowBlur||0}px ${t.shadowColor||'rgba(0,0,0,0.3)'}`:'none',cursor:t.locked?'not-allowed':'move',userSelect:editingTextId===t.id?'text':'none'}}
            contentEditable={editingTextId===t.id}
            suppressContentEditableWarning
            onInput={e=>onEditInput(t,e)}
            onBlur={()=>setEditingTextId(null)}
          >{t.content||'Votre texte'}</div>
          {selectedTextId===t.id&&!t.locked&&(<>
            <div className="selection-ring" />
            <div className="rotate-handle" onPointerDown={e=>onRotatePointerDown(t,e)} />
          </>)}
        </div>
      ))}

      {nearCenterX&&<div className="guide-line vertical" />}
      {nearCenterY&&<div className="guide-line horizontal" />}
      {uploadedImageUrl&&Math.abs(imageXPercent-50)<1&&<div className="guide-line vertical" />}
      {uploadedImageUrl&&Math.abs(imageYPercent-50)<1&&<div className="guide-line horizontal" />}

      {!previewMode&&(<>
        <div className="safe-area" aria-hidden="true" />
        <div className="guide-line vertical" aria-hidden="true" />
        <div className="guide-line horizontal" aria-hidden="true" />
        <div className="ruler ruler-bottom" aria-hidden="true">
          {xTicks.map(x=>(<React.Fragment key={`rx-${x}`}>
            <div className="ruler-tick" style={{left:`${x}px`}} />
            {x%Math.round(majorStep)===0&&<div className="ruler-label" style={{left:`${x}px`}}>{rulerUnit==='px'?`${x}px`:`${(x/PX_PER_CM).toFixed(1)}cm`}</div>}
          </React.Fragment>))}
        </div>
        <div className="ruler ruler-left" aria-hidden="true">
          {yTicks.map(y=>(<React.Fragment key={`ry-${y}`}>
            <div className="ruler-tick" style={{top:`${y}px`}} />
            {y%Math.round(majorStep)===0&&<div className="ruler-label" style={{top:`${y}px`}}>{rulerUnit==='px'?`${y}px`:`${(y/PX_PER_CM).toFixed(1)}cm`}</div>}
          </React.Fragment>))}
        </div>
        {guideLines?.filter(g=>showBack?g.side==='back':g.side==='front').map(g=>(
          <div key={g.id} className={`user-guide ${g.type}`} style={g.type==='vertical'?{left:`${g.percent}%`}:{top:`${g.percent}%`}} onPointerDown={e=>onGuidePointerDown(g,e)}>
            <button className="guide-delete" title="Supprimer" onClick={e=>{e.stopPropagation();deleteGuideLine(g.id);}}>×</button>
          </div>
        ))}
      </>)}
    </div>
  );
});
