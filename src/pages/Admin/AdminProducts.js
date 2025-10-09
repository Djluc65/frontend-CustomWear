import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit2, 
  FiTrash2, 
  FiEye,
  FiX,
  FiUpload,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiPackage
} from 'react-icons/fi';
import { 
  fetchAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../../store/slices/adminSlice';
import { adminAPI } from '../../services/api';
import './AdminProducts.css';

const AdminProducts = () => {
  const dispatch = useDispatch();
  const { products: productsState, loading, error } = useSelector(state => state.admin);
  const products = productsState?.items || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [],
    status: 'active'
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  const productsPerPage = 10;

  // Catégories conformes au backend
  const categories = [
    { id: 'all', name: 'Toutes les catégories' },
    { id: 't-shirts', name: 'T-shirts' },
    { id: 'vestes', name: 'Vestes' },
    { id: 'casquettes', name: 'Casquettes' },
    { id: 'vaisselle', name: 'Vaisselle' }
  ];

  useEffect(() => {
    dispatch(fetchAllProducts({ page: 1, limit: 50 }));
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    
    // Créer des URLs de prévisualisation
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
    
    // Mettre à jour formData avec les noms des fichiers
    setFormData({
      ...formData,
      images: files.map(file => file.name)
    });
  };

  const removeImage = (index) => {
    const newSelectedImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    
    setSelectedImages(newSelectedImages);
    setImagePreview(newPreviews);
    setFormData({
      ...formData,
      images: newSelectedImages.map(file => file.name)
    });
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      images: [],
      status: 'active'
    });
    setSelectedImages([]);
    setImagePreview([]);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: (product.price?.base ?? product.price ?? '').toString(),
      category: typeof product.category === 'string' ? product.category : (product.category?.name || ''),
      stock: (product.stock ?? product.totalStock ?? 0).toString(),
      images: product.images || [],
      status: product.status || 'active'
    });
    // Pour l'édition, on ne charge pas les images existantes dans selectedImages
    // car elles sont déjà stockées côté serveur
    setSelectedImages([]);
    setImagePreview([]);
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await dispatch(deleteProduct(productId)).unwrap();
        dispatch(fetchAllProducts({ page: 1, limit: 50 }));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const rawPrice = String(formData.price || '').replace(',', '.');
      const parsedPrice = parseFloat(rawPrice);
      if (Number.isNaN(parsedPrice)) {
        throw new Error('Prix invalide. Utilisez 12,50 ou 12.50');
      }
      const productData = {
        ...formData,
        price: { base: parsedPrice }
      };

      // Normaliser et appliquer des valeurs par défaut pour éviter les erreurs côté serveur
      productData.name = (productData.name || '').trim();
      productData.description = (productData.description || '').trim() || 'Description produit';
      productData.category = (productData.category || '').trim();

      // Si des images ont été sélectionnées, les uploader d'abord
      if (selectedImages && selectedImages.length > 0) {
        const uploadRes = await adminAPI.uploadImages(selectedImages);
        const urls = uploadRes?.data?.data?.urls || [];
        productData.images = urls.map((url, idx) => ({ url, isPrimary: idx === 0 }));
      }

      if (editingProduct) {
        await dispatch(updateProduct({ 
          id: editingProduct._id, 
          productData 
        })).unwrap();
        window.alert('Produit modifié');
      } else {
        await dispatch(createProduct(productData)).unwrap();
        window.alert('Produit ajouté');
      }

      setShowModal(false);
      dispatch(fetchAllProducts({ page: 1, limit: 50 }));
    } catch (error) {
      const backendMsg = error?.response?.data?.message || error?.message || 'Erreur lors de la sauvegarde du produit';
      console.error('Erreur lors de la sauvegarde:', backendMsg, error);
      window.alert(backendMsg);
    }
  };

  const closeModal = () => {
    // Nettoyer les URLs de prévisualisation pour éviter les fuites mémoire
    imagePreview.forEach(url => URL.revokeObjectURL(url));
    setImagePreview([]);
    setSelectedImages([]);
    setShowModal(false);
    setEditingProduct(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Actif', class: 'status-active' },
      inactive: { label: 'Inactif', class: 'status-inactive' },
      draft: { label: 'Brouillon', class: 'status-draft' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  // Calcul de la pagination (robuste aux éléments invalides)
  const safeProducts = Array.isArray(products) ? products.filter(p => p && typeof p === 'object') : [];
  if (process.env.NODE_ENV === 'development') {
    const invalidItems = (Array.isArray(products) ? products : []).filter(p => !p || typeof p !== 'object' || typeof p.name !== 'string');
    if (invalidItems.length) {
      // Aide au diagnostic pour les données mal formées
      // Affiche jusqu’à 3 éléments problématiques
      console.warn('[AdminProducts] Produits invalides détectés:', invalidItems.slice(0, 3));
    }
  }
  const filteredProducts = safeProducts.filter(product => {
    const name = typeof product.name === 'string' ? product.name : '';
    const description = typeof product.description === 'string' ? product.description : '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          description.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryValue = typeof product.category === 'string' ? product.category : product.category?.name;
    const matchesCategory = categoryFilter === 'all' || categoryValue === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const pagination = {
    total: totalProducts,
    totalPages,
    currentPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };

  if (loading && products.length === 0) {
    return (
      <div className="admin-products">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-products">
      {/* Header */}
      <div className="products-header">
        <div className="header-left">
          <h1>Gestion des Produits</h1>
          <p>{pagination?.total || 0} produits au total</p>
        </div>
        <button className="add-product-btn" onClick={handleAddProduct}>
          <FiPlus />
          Ajouter un Produit
        </button>
      </div>

      {/* Filters */}
      <div className="products-filters">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select
            value={categoryFilter}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            className="category-filter"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="draft">Brouillon</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map((product) => (
              <motion.tr
                key={product._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <td className="product-info">
                  <div className="product-cell">
                    <div className="product-image">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]?.url || product.images[0]} alt={product.name} />
                      ) : (
                        <div className="no-image">
                          <FiImage />
                        </div>
                      )}
                    </div>
                    <div className="product-details">
                      <h4>{product.name}</h4>
                      <p>{product.description?.substring(0, 50)}...</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="category-tag">
                    {typeof product.category === 'string' ? product.category : (product.category?.name || 'Non catégorisé')}
                  </span>
                </td>
                <td className="price-cell">
                  {Number(product.price?.base ?? product.price ?? 0).toLocaleString('fr-FR')} €
                </td>
                <td className="stock-cell">
                  <span className={`stock-badge ${((product.stock ?? product.totalStock ?? 0) < 10) ? 'low-stock' : ''}`}>
                    {product.stock !== undefined ? product.stock : (product.totalStock ?? '-')}
                  </span>
                </td>
                <td>
                  {getStatusBadge(product.status || 'active')}
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      className="action-btn view-btn"
                      title="Voir"
                    >
                      <FiEye />
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditProduct(product)}
                      title="Modifier"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteProduct(product._id)}
                      title="Supprimer"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && !loading && (
          <div className="empty-state">
            <FiPackage className="empty-icon" />
            <h3>Aucun produit trouvé</h3>
            <p>Commencez par ajouter votre premier produit</p>
            <button className="add-product-btn" onClick={handleAddProduct}>
              <FiPlus />
              Ajouter un Produit
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {Math.ceil(products.length / productsPerPage) > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <FiChevronLeft />
            Précédent
          </button>
          
          <div className="pagination-info">
            Page {currentPage} sur {Math.ceil(products.length / productsPerPage)}
          </div>
          
          <button
            className="pagination-btn"
            disabled={currentPage === Math.ceil(products.length / productsPerPage)}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Suivant
            <FiChevronRight />
          </button>
        </div>
      )}

      {/* Modal pour ajouter/modifier un produit */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{editingProduct ? 'Modifier le Produit' : 'Ajouter un Produit'}</h2>
                <button className="close-btn" onClick={closeModal}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-group">
                  <label>Nom du produit</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Images du produit</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="file-input"
                  />
                  <small className="form-help">Vous pouvez sélectionner plusieurs images (formats: JPG, PNG, GIF)</small>
                  
                  {imagePreview.length > 0 && (
                    <div className="image-preview-container">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={preview} alt={`Aperçu ${index + 1}`} className="image-preview" />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeImage(index)}
                            title="Supprimer cette image"
                          >
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Prix (€)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]+([.,][0-9]{1,2})?"
                      name="price"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="ex: 12,50 ou 12.50"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Catégorie</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="t-shirts">T-shirts</option>
                    <option value="vestes">Vestes</option>
                    <option value="casquettes">Casquettes</option>
                    <option value="vaisselle">Vaisselle</option>
                  </select>
                  </div>

                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="draft">Brouillon</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={closeModal}>
                    Annuler
                  </button>
                  <button type="submit" className="save-btn">
                    {editingProduct ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default AdminProducts;