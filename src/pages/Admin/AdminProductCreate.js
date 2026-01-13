import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiUpload, FiImage, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Card } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';

const CATEGORIES = [
  { slug: 't-shirts', name: 'T-shirts' },
  { slug: 'casquettes', name: 'Casquettes' },
  { slug: 'bonnets', name: 'Bonnets' },
  { slug: 'vestes', name: 'Vêstes' },
  { slug: 'vaisselle', name: 'Vaisselle' }
];

const GENDERS = [
  { value: 'unisexe', label: 'Unisexe' },
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
  { value: 'enfant', label: 'Enfant' }
];

const ALLOWED_COLORS = ['Noir', 'Blanc', 'Bleu', 'Marron', 'Rose', 'Jaune', 'Vert', 'Mauve', 'Gris'];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

const AdminProductCreate = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: 't-shirts',
    gender: 'unisexe',
    priceBase: '',
    status: 'active',
    featured: false,
    colors: [],
    sizes: [],
    stock: ''
  });

  const [mainImages, setMainImages] = useState({ front: null, back: null });
  const [colorImages, setColorImages] = useState({}); // { 'Noir': { front, back } }

  const generateSku = (name) => {
    const base = (name || 'PRD').toString().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${base}-${Date.now().toString().slice(-4)}-${suffix}`;
  };

  const uploadSingleImage = async (file) => {
    const res = await adminAPI.uploadImages([file]);
    const asset = res?.data?.data?.assets?.[0];
    if (!asset) throw new Error('Upload image échoué');
    return asset; // { url, public_id }
  };

  const handleMainImageChange = async (side, file) => {
    if (!file) return;
    try {
      setUploading(true);
      const asset = await uploadSingleImage(file);
      setMainImages(prev => ({ ...prev, [side]: asset }));
    } catch (e) {
      window.alert(e?.message || 'Upload échoué');
    } finally {
      setUploading(false);
    }
  };

  const handleColorImageChange = async (color, side, file) => {
    if (!file) return;
    try {
      setUploading(true);
      const asset = await uploadSingleImage(file);
      setColorImages(prev => ({ ...prev, [color]: { ...(prev[color] || {}), [side]: asset } }));
    } catch (e) {
      window.alert(e?.message || 'Upload échoué');
    } finally {
      setUploading(false);
    }
  };

  const toggleColor = (color) => {
    setForm(prev => {
      const exists = prev.colors.includes(color);
      const colors = exists ? prev.colors.filter(c => c !== color) : [...prev.colors, color];
      if (exists) {
        setColorImages(ci => {
          const copy = { ...ci };
          delete copy[color];
          return copy;
        });
      } else {
        setColorImages(ci => ({ ...ci, [color]: ci[color] || { front: null, back: null } }));
      }
      return { ...prev, colors };
    });
  };

  const toggleSize = (size) => {
    setForm(prev => {
      const exists = prev.sizes.includes(size);
      const sizes = exists ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.priceBase) {
      window.alert('Veuillez renseigner le nom, la description et le prix de base');
      return;
    }
    if (!mainImages.front || !mainImages.back) {
      window.alert('Veuillez téléverser les images principales (avant et arrière)');
      return;
    }
    for (const c of form.colors) {
      const entry = colorImages[c] || {};
      if (!entry.front || !entry.back) {
        window.alert(`Veuillez téléverser avant et arrière pour la couleur: ${c}`);
        return;
      }
    }

    try {
      setCreating(true);
      const imagesPayload = [];
      imagesPayload.push({
        url: mainImages.front.secure_url || mainImages.front.url,
        publicId: mainImages.front.public_id || mainImages.front.publicId,
        isPrimary: true,
        side: 'front'
      });
      imagesPayload.push({
        url: mainImages.back.secure_url || mainImages.back.url,
        publicId: mainImages.back.public_id || mainImages.back.publicId,
        side: 'back'
      });
      for (const c of form.colors) {
        const entry = colorImages[c];
        imagesPayload.push({
          url: entry.front.secure_url || entry.front.url,
          publicId: entry.front.public_id || entry.front.publicId,
          color: c,
          side: 'front'
        });
        imagesPayload.push({
          url: entry.back.secure_url || entry.back.url,
          publicId: entry.back.public_id || entry.back.publicId,
          color: c,
          side: 'back'
        });
      }

      const payload = {
        name: form.name,
        description: form.description,
        shortDescription: form.shortDescription || '',
        category: form.category,
        gender: form.gender,
        sku: generateSku(form.name),
        images: imagesPayload,
        price: { base: Number(form.priceBase), currency: 'EUR' },
        colors: form.colors,
        sizes: form.sizes,
        status: form.status || 'active',
        featured: !!form.featured,
        stock: form.stock ? Number(form.stock) : undefined
      };

      const res = await adminAPI.createProduct(payload);
      window.alert('Produit créé avec succès');
      navigate('/admin/products');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Création échouée';
      window.alert(msg);
    } finally {
      setCreating(false);
    }
  };

  const ImageUploadBox = ({ label, image, onChange, id }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative group">
        <div className={`
          border-2 border-dashed rounded-lg p-4 h-48 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
          ${image ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
        `}>
          {image ? (
            <>
              <img 
                src={image.secure_url || image.url} 
                alt="Preview" 
                className="h-full w-full object-contain rounded"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <FiUpload className="text-white text-3xl" />
              </div>
            </>
          ) : (
            <>
              <FiImage className="text-4xl text-slate-300 mb-2" />
              <span className="text-sm text-slate-500 font-medium">Cliquez pour ajouter</span>
            </>
          )}
          <input 
            type="file" 
            id={id}
            accept="image/*" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto min-h-screen bg-slate-50/50">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')} className="text-slate-500 -ml-2">
                <FiArrowLeft className="mr-2" /> Retour
              </Button>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Nouveau Produit</h1>
            <p className="text-slate-500">Créez un nouveau produit pour votre catalogue</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/admin/products')}
              className="flex-1 md:flex-none"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1 md:flex-none" 
              disabled={creating || uploading}
            >
              {creating ? <FiLoader className="animate-spin mr-2" /> : <FiSave className="mr-2" />}
              {creating ? 'Création...' : 'Créer le produit'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-6 bg-white shadow-sm border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                Informations générales
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du produit <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name"
                    value={form.name} 
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: T-Shirt Premium Cotton"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Description courte</Label>
                  <Input 
                    id="shortDescription"
                    value={form.shortDescription} 
                    onChange={(e) => setForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                    placeholder="Résumé pour les cartes produits..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description complète <span className="text-red-500">*</span></Label>
                  <textarea 
                    id="description"
                    className="flex min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.description} 
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Détails complets du produit..."
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-sm border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                Images principales <span className="text-red-500">*</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUploadBox 
                  label="Vue Avant" 
                  image={mainImages.front} 
                  onChange={(e) => handleMainImageChange('front', e.target.files?.[0])}
                  id="main-front"
                />
                <ImageUploadBox 
                  label="Vue Arrière" 
                  image={mainImages.back} 
                  onChange={(e) => handleMainImageChange('back', e.target.files?.[0])}
                  id="main-back"
                />
              </div>
            </Card>

            {form.colors.length > 0 && (
              <Card className="p-6 bg-white shadow-sm border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                  Images par couleur
                </h2>
                <div className="space-y-6">
                  {form.colors.map(c => (
                    <div key={c} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-current" style={{ color: c === 'Blanc' ? '#e2e8f0' : c === 'Noir' ? '#0f172a' : c.toLowerCase() }}></span>
                        {c}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ImageUploadBox 
                          label={`Avant (${c})`}
                          image={colorImages[c]?.front} 
                          onChange={(e) => handleColorImageChange(c, 'front', e.target.files?.[0])}
                          id={`color-${c}-front`}
                        />
                        <ImageUploadBox 
                          label={`Arrière (${c})`}
                          image={colorImages[c]?.back} 
                          onChange={(e) => handleColorImageChange(c, 'back', e.target.files?.[0])}
                          id={`color-${c}-back`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            <Card className="p-6 bg-white shadow-sm border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Organisation</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select 
                    value={form.category} 
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Genre</Label>
                  <Select 
                    value={form.gender} 
                    onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    {GENDERS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select 
                    value={form.status} 
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </Select>
                </div>
                <div className="pt-2">
                  <Checkbox 
                    label="Produit mis en avant" 
                    checked={form.featured} 
                    onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-sm border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Prix et Stock</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="priceBase">Prix de base (€) <span className="text-red-500">*</span></Label>
                  <Input 
                    id="priceBase"
                    type="number" 
                    step="0.01" 
                    value={form.priceBase} 
                    onChange={(e) => setForm(prev => ({ ...prev, priceBase: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock global</Label>
                  <Input 
                    id="stock"
                    type="number" 
                    value={form.stock} 
                    onChange={(e) => setForm(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="Illimité si vide"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-sm border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Variantes</h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Tailles disponibles</Label>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map(s => (
                      <label 
                        key={s} 
                        className={`
                          cursor-pointer px-3 py-1.5 rounded text-sm font-medium border transition-colors
                          ${form.sizes.includes(s) 
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
                        `}
                      >
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={form.sizes.includes(s)} 
                          onChange={() => toggleSize(s)} 
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Couleurs disponibles</Label>
                  <div className="flex flex-wrap gap-2">
                    {ALLOWED_COLORS.map(c => (
                      <label 
                        key={c} 
                        className={`
                          cursor-pointer pl-2 pr-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-2
                          ${form.colors.includes(c) 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
                        `}
                      >
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={form.colors.includes(c)} 
                          onChange={() => toggleColor(c)} 
                        />
                        <span className={`w-3 h-3 rounded-full border border-white/20`} style={{ backgroundColor: c === 'Blanc' ? '#fff' : c === 'Noir' ? '#000' : c === 'Marron' ? '#8B4513' : c === 'Rose' ? '#FFC0CB' : c === 'Jaune' ? '#FFD700' : c === 'Vert' ? '#008000' : c === 'Mauve' ? '#800080' : c === 'Gris' ? '#808080' : c.toLowerCase() }}></span>
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminProductCreate;
