import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiLayers,
  FiImage,
  FiUpload,
  FiX,
  FiChevronUp,
  FiFilter
} from 'react-icons/fi';
import { modelsAPI, productsAPI } from '../../services/api';
import { sortSizes } from '../../utils/sizes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Card } from '../../components/ui/card';

// Utils
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const toCategorySlug = (cat) => {
  if (!cat) return '';
  if (typeof cat === 'object') return cat.slug || '';
  return String(cat).toLowerCase();
};

const ALLOWED_TYPES = ['t-shirt', 'sweat', 'hoodie', 'casquette', 'mug'];
const ALLOWED_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'Unisexe'];
const ALLOWED_COLORS = [
  'Noir',
  'Blanc',
  'Bleu',
  'Vert',
  'Jaune',
  'Rouge',
  'Mauve',
  'Rose',
  'Marron',
  'Gris',
  'Vert palme',
  'Bleu palme'
];
const ALLOWED_GENDERS = ['unisexe', 'homme', 'femme', 'enfant'];

const PREFERRED_CATEGORIES = [
  { slug: 't-shirts', name: 'T-shirts' },
  { slug: 'vestes', name: 'Vêstes' },
  { slug: 'casquettes', name: 'Casquettes' },
  { slug: 'bonnets', name: 'Bonnets' },
  { slug: 'vaisselles', name: 'Vaisselles' }
];

const AdminModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState([]);
  const [sizeFilter, setSizeFilter] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 't-shirt',
    category: '',
    gender: 'unisexe',
    basePrice: '',
    sizes: ['S', 'M', 'L'],
    colors: ['Noir', 'Blanc'],
    images: { front: '', back: '' },
    imagesByColor: {},
    active: true
  });
  
  // File states
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview, setBackPreview] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [colorSideFiles, setColorSideFiles] = useState({});
  const [colorSidePreviews, setColorSidePreviews] = useState({});

  const [uploadErrors, setUploadErrors] = useState({ front: '', back: '', byColor: {} });
  const [dragOver, setDragOver] = useState({ front: false, back: false, byColor: {} });
  
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const ACCEPTED_MIME = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];

  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        const res = await modelsAPI.getModels({});
        const items = res?.data?.data || res?.data || [];
        setModels(Array.isArray(items) ? items : []);
        setError(null);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await productsAPI.getCategories();
        if (!cancelled) {
          setCategories(PREFERRED_CATEGORIES);
          setCategoriesError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setCategoriesError(err?.response?.data?.message || err?.message || 'Erreur de chargement des catégories');
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    };
    loadCategories();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const toggleColorFilter = (color) => {
    setColorFilter(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };
  const toggleSizeFilter = (size) => {
    setSizeFilter(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const filteredModels = models.filter(m => {
    const name = (m?.name || '').toLowerCase();
    const type = (m?.type || '').toLowerCase();
    const gender = (m?.gender || '').toLowerCase();
    const category = toCategorySlug(m?.category || '');
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || type === typeFilter;
    const matchesGender = genderFilter === 'all' || gender === genderFilter;
    const matchesCategory = categoryFilter === 'all' || category === String(categoryFilter).toLowerCase();
    const matchesColor = colorFilter.length === 0 || (Array.isArray(m.colors) && m.colors.some(c => colorFilter.includes(c)));
    const matchesSize = sizeFilter.length === 0 || (Array.isArray(m.sizes) && m.sizes.some(s => sizeFilter.includes(s)));
    return matchesSearch && matchesType && matchesGender && matchesCategory && matchesColor && matchesSize;
  });

  const handleAddModel = () => {
    setEditingModel(null);
    setForm({
      name: '',
      description: '',
      type: 't-shirt',
      category: '',
      gender: 'unisexe',
      basePrice: '',
      sizes: ['S', 'M', 'L'],
      colors: ['Noir', 'Blanc'],
      images: { front: '', back: '' },
      imagesByColor: {},
      active: true
    });
    setFrontFile(null);
    setBackFile(null);
    setFrontPreview('');
    setBackPreview('');
    setColorSideFiles({});
    setColorSidePreviews({});
    setUploadErrors({ front: '', back: '', byColor: {} });
    setDragOver({ front: false, back: false, byColor: {} });
    setShowModal(true);
  };

  const handleEditModel = (model) => {
    setEditingModel(model);
    setForm({
      name: model?.name || '',
      description: model?.description || '',
      type: model?.type || 't-shirt',
      category: toCategorySlug(model?.category || ''),
      gender: (model?.gender || 'unisexe'),
      basePrice: String(model?.basePrice ?? ''),
      sizes: Array.isArray(model?.sizes) ? model.sizes : [],
      colors: Array.isArray(model?.colors) ? model.colors : [],
      images: model?.images || { front: '', back: '' },
      imagesByColor: model?.imagesByColor || {},
      active: !!model?.active
    });
    setFrontFile(null);
    setBackFile(null);
    setFrontPreview(model?.images?.front || '');
    setBackPreview(model?.images?.back || '');
    setColorSideFiles({});
    setColorSidePreviews({});
    setUploadErrors({ front: '', back: '', byColor: {} });
    setDragOver({ front: false, back: false, byColor: {} });
    setShowModal(true);
  };

  const handleDeleteModel = async (id) => {
    if (!window.confirm('Supprimer ce modèle ?')) return;
    try {
      await modelsAPI.deleteModel(id);
      setModels(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur suppression');
    }
  };

  const validateFile = (file) => {
    if (!file) return 'Fichier manquant';
    if (!ACCEPTED_MIME.includes(file.type)) return 'Format non supporté (JPG, PNG, WebP, GIF, SVG)';
    if (file.size > MAX_IMAGE_SIZE) return 'Fichier trop volumineux (> 5 Mo)';
    return null;
  };

  const handleFileChange = (e, side, color = null) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file, side, color);
  };

  const processFile = (file, side, color = null) => {
    const err = validateFile(file);
    if (color) {
      setUploadErrors(prev => ({
        ...prev,
        byColor: { ...prev.byColor, [color]: { ...prev.byColor?.[color], [side]: err || '' } }
      }));
    } else {
      setUploadErrors(prev => ({ ...prev, [side]: err || '' }));
    }

    if (err) return;

    const preview = URL.createObjectURL(file);
    if (color) {
      setColorSideFiles(prev => ({
        ...prev,
        [color]: { ...prev[color], [side]: file }
      }));
      setColorSidePreviews(prev => ({
        ...prev,
        [color]: { ...prev[color], [side]: preview }
      }));
    } else {
      if (side === 'front') {
        setFrontFile(file);
        setFrontPreview(preview);
      } else {
        setBackFile(file);
        setBackPreview(preview);
      }
    }
  };

  const handleDrop = (e, side, color = null) => {
    e.preventDefault();
    if (color) {
      setDragOver(prev => ({ ...prev, byColor: { ...prev.byColor, [color]: { ...prev.byColor?.[color], [side]: false } } }));
    } else {
      setDragOver(prev => ({ ...prev, [side]: false }));
    }
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file, side, color);
  };

  const handleDragOver = (e, side, color = null) => {
    e.preventDefault();
    if (color) {
      setDragOver(prev => ({ ...prev, byColor: { ...prev.byColor, [color]: { ...prev.byColor?.[color], [side]: true } } }));
    } else {
      setDragOver(prev => ({ ...prev, [side]: true }));
    }
  };

  const handleDragLeave = (e, side, color = null) => {
    e.preventDefault();
    if (color) {
      setDragOver(prev => ({ ...prev, byColor: { ...prev.byColor, [color]: { ...prev.byColor?.[color], [side]: false } } }));
    } else {
      setDragOver(prev => ({ ...prev, [side]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('type', form.type);
      formData.append('category', form.category);
      formData.append('gender', form.gender);
      formData.append('basePrice', form.basePrice);
      formData.append('active', form.active);

      form.sizes.forEach(s => formData.append('sizes[]', s));
      form.colors.forEach(c => formData.append('colors[]', c));

      if (frontFile) formData.append('frontImage', frontFile);
      if (backFile) formData.append('backImage', backFile);

      // Images par couleur
      form.colors.forEach(color => {
        const cFiles = colorSideFiles[color];
        if (cFiles?.front) formData.append(`color_${color}_front`, cFiles.front);
        if (cFiles?.back) formData.append(`color_${color}_back`, cFiles.back);
      });

      if (editingModel) {
        const res = await modelsAPI.updateModel(editingModel._id, formData);
        setModels(prev => prev.map(m => m._id === editingModel._id ? (res.data.data || res.data) : m));
      } else {
        const res = await modelsAPI.createModel(formData);
        setModels(prev => [...prev, (res.data.data || res.data)]);
      }
      setShowModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FiLayers className="text-blue-600" />
            Gestion des Modèles
          </h1>
          <p className="text-slate-500 mt-1">Gérez les modèles de base pour la personnalisation</p>
        </div>
        <Button onClick={handleAddModel} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-600/20">
          <FiPlus size={20} />
          Nouveau Modèle
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-8 bg-white border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher un modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="min-w-[140px]">
              <option value="all">Tous types</option>
              {ALLOWED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="min-w-[140px]">
              <option value="all">Tous genres</option>
              {ALLOWED_GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="min-w-[140px]">
              <option value="all">Toutes catégories</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      {/* Grid Content */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredModels.map((model) => (
              <motion.div
                key={model._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="aspect-square bg-slate-100 relative overflow-hidden group-hover:bg-slate-200 transition-colors">
                  {model.images?.front ? (
                    <img src={model.images.front} alt={model.name} className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><FiImage size={48} /></div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                    <button onClick={() => handleEditModel(model)} className="p-2 bg-white rounded-full text-blue-600 shadow-md hover:bg-blue-50 transition-colors"><FiEdit2 /></button>
                    <button onClick={() => handleDeleteModel(model._id)} className="p-2 bg-white rounded-full text-red-600 shadow-md hover:bg-red-50 transition-colors"><FiTrash2 /></button>
                  </div>
                  {!model.active && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-slate-900/50 text-white text-xs rounded-md backdrop-blur-sm">Inactif</div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 truncate">{model.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <span className="capitalize">{model.type}</span>
                    <span>•</span>
                    <span className="capitalize">{model.gender}</span>
                  </div>
                  {model.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{model.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-bold text-blue-600">{model.basePrice} €</span>
                    <div className="flex gap-1">
                       {model.colors?.slice(0, 3).map(c => (
                         <div key={c} className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: c.toLowerCase() === 'noir' ? 'black' : c.toLowerCase() === 'blanc' ? 'white' : c.toLowerCase() }} title={c} />
                       ))}
                       {model.colors?.length > 3 && <span className="text-xs text-slate-400">+{model.colors.length - 3}</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-900">{editingModel ? 'Modifier le modèle' : 'Nouveau modèle'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><FiX size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom du modèle</label>
                    <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: T-Shirt Premium Bio" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                      value={form.description} 
                      onChange={e => setForm({...form, description: e.target.value})} 
                      placeholder="Description du modèle..." 
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                      <Select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                        {ALLOWED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Genre</label>
                      <Select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                        {ALLOWED_GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                      <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                        <option value="">Sélectionner...</option>
                        {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Prix de base (€)</label>
                      <Input type="number" step="0.01" value={form.basePrice} onChange={e => setForm({...form, basePrice: e.target.value})} required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tailles disponibles</label>
                    <div className="flex flex-wrap gap-2">
                      {ALLOWED_SIZES.map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            sizes: prev.sizes.includes(size) ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size]
                          }))}
                          className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                            form.sizes.includes(size)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Couleurs disponibles</label>
                    <div className="flex flex-wrap gap-2">
                      {ALLOWED_COLORS.map(color => {
                        const lower = color.toLowerCase();
                        let swatchColor = lower;
                        if (lower === 'noir') swatchColor = '#000000';
                        else if (lower === 'blanc') swatchColor = '#ffffff';
                        else if (lower === 'gris') swatchColor = '#6b7280';
                        else if (lower.startsWith('vert')) swatchColor = '#166534';
                        else if (lower.startsWith('bleu')) swatchColor = '#1e3a8a';
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setForm(prev => ({
                              ...prev,
                              colors: prev.colors.includes(color) ? prev.colors.filter(c => c !== color) : [...prev.colors, color]
                            }))}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                              form.colors.includes(color)
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: swatchColor }} />
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                     <input
                       type="checkbox"
                       id="activeCheck"
                       checked={form.active}
                       onChange={e => setForm({...form, active: e.target.checked})}
                       className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                     />
                     <label htmlFor="activeCheck" className="text-slate-900 font-medium">Modèle actif (visible sur le site)</label>
                  </div>
                </div>

                {/* Right Column: Images */}
                <div className="space-y-6">
                   <h3 className="font-semibold text-slate-900">Images par défaut</h3>
                   <div className="grid grid-cols-2 gap-4">
                     {['front', 'back'].map(side => (
                       <div key={side} className="space-y-2">
                         <span className="text-xs font-semibold uppercase text-slate-500">{side === 'front' ? 'Face Avant' : 'Face Arrière'}</span>
                         <div
                           className={`relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                             dragOver[side] ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                           }`}
                           onDrop={(e) => handleDrop(e, side)}
                           onDragOver={(e) => handleDragOver(e, side)}
                           onDragLeave={(e) => handleDragLeave(e, side)}
                           onClick={() => document.getElementById(`file-${side}`).click()}
                         >
                           {(side === 'front' ? frontPreview : backPreview) ? (
                             <img src={side === 'front' ? frontPreview : backPreview} alt={side} className="w-full h-full object-contain p-2" />
                           ) : (
                             <div className="text-center p-4">
                               <FiUpload className="mx-auto text-2xl text-slate-400 mb-2" />
                               <span className="text-xs text-slate-500">Glisser ou cliquer</span>
                             </div>
                           )}
                           <input type="file" id={`file-${side}`} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, side)} />
                         </div>
                         {uploadErrors[side] && <p className="text-xs text-red-500">{uploadErrors[side]}</p>}
                       </div>
                     ))}
                   </div>
                   
                   {form.colors.length > 0 && (
                     <div className="mt-8 pt-8 border-t border-slate-100">
                        <h3 className="font-semibold text-slate-900 mb-4">Images par couleur (optionnel)</h3>
                        <div className="space-y-6">
                          {form.colors.map(color => {
                            const lower = color.toLowerCase();
                            let swatchColor = lower;
                            if (lower === 'noir') swatchColor = '#000000';
                            else if (lower === 'blanc') swatchColor = '#ffffff';
                            else if (lower === 'gris') swatchColor = '#6b7280';
                            else if (lower.startsWith('vert')) swatchColor = '#166534';
                            else if (lower.startsWith('bleu')) swatchColor = '#1e3a8a';
                            return (
                              <div key={color} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: swatchColor }}></span>
                                  {color}
                                </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {['front', 'back'].map(side => (
                                  <div key={`${color}-${side}`} className="relative">
                                     <div
                                        className={`h-24 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer bg-white ${
                                          dragOver.byColor[color]?.[side] ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400'
                                        }`}
                                        onClick={() => document.getElementById(`file-${color}-${side}`).click()}
                                      >
                                        {(colorSidePreviews[color]?.[side] || form.imagesByColor?.[color]?.[side]) ? (
                                          <img src={colorSidePreviews[color]?.[side] || form.imagesByColor?.[color]?.[side]} alt={`${color} ${side}`} className="h-full w-full object-contain p-1" />
                                        ) : (
                                          <FiPlus className="text-slate-400" />
                                        )}
                                        <input type="file" id={`file-${color}-${side}`} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, side, color)} />
                                     </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                     </div>
                   )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="border-slate-300 text-slate-700 hover:bg-slate-50">Annuler</Button>
                <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20" disabled={loading}>
                  {loading ? 'Sauvegarde...' : 'Enregistrer le modèle'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={handleScrollTop}
            className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
          >
            <FiChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminModels;
