import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiHeart, FiShare2, FiStar, FiMinus, FiPlus } from 'react-icons/fi';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaTiktok, FaTelegramPlane, FaLink } from 'react-icons/fa';
import { fetchProductById } from '../store/slices/productsSlice';
import { addToCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { usersAPI } from '../services/api';
import './ProductDetail.css';
import ProductSlideshow from '../components/Products/ProductSlideshow';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentProduct, isLoading, error } = useSelector(state => state.products);
  const { user } = useSelector(state => state.auth);
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [customization, setCustomization] = useState({
    text: '',
    color: '#000000',
    position: 'center'
  });
  const [showCustomization, setShowCustomization] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProduct && currentProduct.variants && currentProduct.variants.length > 0) {
      setSelectedVariant(currentProduct.variants[0]);
    }
    if (currentProduct) {
      setLiked(Boolean(currentProduct.likedByUser));
    }
  }, [currentProduct]);

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Veuillez sélectionner une variante');
      return;
    }

    const cartItem = {
      productId: currentProduct._id,
      variantId: selectedVariant._id,
      quantity,
      customization: showCustomization ? customization : null
    };

    dispatch(addToCart(cartItem));
    toast.success('Produit ajouté au panier !');
  };

  const handleCustomize = () => {
    navigate(`/customize?product=${currentProduct._id}&variant=${selectedVariant?._id}`);
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      toast.info('Connectez-vous pour gérer vos favoris');
      navigate('/auth');
      return;
    }

    try {
      if (!liked) {
        await usersAPI.addToWishlist(currentProduct._id);
        setLiked(true);
        toast.success('Ajouté aux favoris');
      } else {
        await usersAPI.removeFromWishlist(currentProduct._id);
        setLiked(false);
        toast.info('Retiré des favoris');
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Erreur lors de la mise à jour des favoris';
      toast.error(message);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (selectedVariant?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  // Partage
  const getProductUrl = () => {
    try {
      return window.location.href;
    } catch {
      return `${window.location.origin}/product/${currentProduct?._id || id}`;
    }
  };

  const getShareText = () => {
    const name = currentProduct?.name || 'Produit';
    return `Découvre ce produit ${name} sur CustomWear`;
  };

  const shareLinks = () => {
    const url = encodeURIComponent(getProductUrl());
    const text = encodeURIComponent(getShareText());
    return {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      instagram: `https://www.instagram.com/`, // Pas d’API web officielle pour partager une URL
      tiktok: `https://www.tiktok.com/`, // Pas d’API web officielle pour partager une URL
    };
  };

  const handleShareClick = async () => {
    const url = getProductUrl();
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: currentProduct?.name, text, url });
        toast.success('Lien partagé via le menu système');
        return;
      } catch (err) {
        // utilisateur a annulé ou erreur, on bascule sur le menu custom
      }
    }
    setShowShareMenu((prev) => !prev);
  };

  const openShare = (platform) => {
    const links = shareLinks();
    const href = links[platform];
    if (!href) return;
    if (platform === 'instagram' || platform === 'tiktok') {
      // Fallback: copie du lien, ouverture de la page d’accueil
      copyLink();
      window.open(href, '_blank', 'noopener');
      toast.info(`Lien copié — colle-le dans ${platform === 'instagram' ? 'Instagram' : 'TikTok'}`);
      setShowShareMenu(false);
      return;
    }
    window.open(href, '_blank', 'noopener');
    setShowShareMenu(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getProductUrl());
      toast.success('Lien copié dans le presse-papiers');
    } catch (err) {
      toast.error('Impossible de copier le lien');
    }
  };

  if (isLoading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du produit...</p>
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="product-detail-error">
        <h2>Produit non trouvé</h2>
        <p>{error || 'Ce produit n\'existe pas ou a été supprimé.'}</p>
        <button onClick={() => navigate('/products')}>
          Retour aux produits
        </button>
      </div>
    );
  }

  const averageRating = currentProduct.reviews?.length > 0 
    ? currentProduct.reviews.reduce((sum, review) => sum + review.rating, 0) / currentProduct.reviews.length 
    : 0;

  // Helper: safely format price values
  const formatPrice = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : '0.00';
  };

  // Helper: safely format a date
  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  // Helper: join array of strings
  const joinList = (arr) => Array.isArray(arr) ? arr.filter(Boolean).join(', ') : '';

  // Helper: get image URL from string or object
  const getImageUrl = (img) => {
    if (!img) return '/api/placeholder/600/600';
    return typeof img === 'string' ? img : (img.url || '/api/placeholder/600/600');
  };

  // Unifie le flag de personnalisation
  const isCustomizable = Boolean(currentProduct?.customizable || currentProduct?.customization?.isCustomizable);

  // Normalise l’affichage du nom de couleur (string ou objet)
  const getColorName = (color) => {
    if (!color) return '';
    return typeof color === 'string' ? color : (color.name || '');
  };

  // Compute a safe minimum price across variants
  const minVariantPrice = (() => {
    if (Array.isArray(currentProduct?.variants) && currentProduct.variants.length > 0) {
      const prices = currentProduct.variants
        .map(v => Number(v?.price))
        .filter(p => Number.isFinite(p));
      if (prices.length > 0) return Math.min(...prices);
    }
    return null;
  })();

  // Effective product-level price (base/sale)
  const effectiveProductPrice = (
    currentProduct?.price?.sale ?? currentProduct?.price?.base ?? null
  );

  return (
    <div className="product-detail">
      <div className="product-detail-container">
        {/* Images du produit */}
        <div className="product-images">
          <div className="main-image">
            <ProductSlideshow
              images={currentProduct.images}
              startIndex={selectedImage}
              onIndexChange={setSelectedImage}
              autoPlay={true}
              interval={3000}
              transition="fade"
            />
          </div>
          <div className="image-thumbnails">
            {currentProduct.images.map((image, index) => (
              <button
                key={index}
                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                onClick={() => setSelectedImage(index)}
              >
                <img src={getImageUrl(image)} alt={`${currentProduct.name} ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Informations du produit */}
        <div className="product-info">
          <div className="product-header">
            <h1>{currentProduct.name}</h1>
            <div className="product-rating">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <FiStar 
                    key={i} 
                    className={i < Math.floor(averageRating) ? 'filled' : ''} 
                  />
                ))}
              </div>
              <span>({currentProduct.reviews?.length || 0} avis)</span>
            </div>
          </div>

          <div className="product-price">
            {selectedVariant ? (
              <>
                <span className="current-price">
                  {formatPrice(selectedVariant?.price)} €
                </span>
                {selectedVariant?.compareAtPrice != null && (
                  <span className="compare-price">
                    {formatPrice(selectedVariant.compareAtPrice)} €
                  </span>
                )}
              </>
            ) : (
              <span className="price-range">
                {minVariantPrice != null 
                  ? `À partir de ${formatPrice(minVariantPrice)} €`
                  : (effectiveProductPrice != null 
                      ? `Prix: ${formatPrice(effectiveProductPrice)} €`
                      : 'Prix indisponible')}
              </span>
            )}
          </div>

          <div className="product-description">
            <p>{currentProduct.description}</p>
          </div>

          {/* Métadonnées du produit */}
          <div className="product-meta">
            <p><strong>Catégorie:</strong> {currentProduct.category}</p>
            {currentProduct.sku && (
              <p><strong>SKU:</strong> {currentProduct.sku}</p>
            )}
            <p><strong>Quantité totale:</strong> {currentProduct.totalStock ?? 0}</p>
          </div>

          {/* Sélection des variantes */}
          {currentProduct.variants && currentProduct.variants.length > 0 && (
            <div className="product-variants">
              <h3>Options disponibles</h3>
              <div className="variants-grid">
                {currentProduct.variants.map((variant) => (
                  <button
                    key={variant._id}
                    className={`variant-option ${selectedVariant?._id === variant._id ? 'selected' : ''}`}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={variant.stock === 0}
                  >
                    <div className="variant-info">
                      <span className="variant-name">
                        {variant.size && `Taille: ${variant.size}`}
                        {getColorName(variant.color) && ` - Couleur: ${getColorName(variant.color)}`}
                      </span>
                      <span className="variant-price">{formatPrice(variant?.price)} €</span>
                    </div>
                    {variant.stock === 0 && <span className="out-of-stock">Rupture</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Personnalisation */}
          {isCustomizable && (
            <div className="customization-section">
              <div className="customization-header">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={showCustomization}
                    onChange={(e) => setShowCustomization(e.target.checked)}
                  />
                  Personnaliser ce produit
                </label>
              </div>
              
              {showCustomization && (
                <motion.div 
                  className="customization-options"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="custom-text">
                    <label>Texte personnalisé</label>
                    <input
                      type="text"
                      value={customization.text}
                      onChange={(e) => setCustomization(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="Votre texte ici..."
                      maxLength={50}
                    />
                  </div>
                  
                  <div className="custom-color">
                    <label>Couleur du texte</label>
                    <input
                      type="color"
                      value={customization.color}
                      onChange={(e) => setCustomization(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                  
                  <button className="customize-advanced" onClick={handleCustomize}>
                    Personnalisation avancée
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Quantité et ajout au panier */}
          <div className="product-actions">
            <div className="quantity-selector">
              <label>Quantité</label>
              <div className="quantity-controls">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <FiMinus />
                </button>
                <span>{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (selectedVariant?.stock || 1)}
                >
                  <FiPlus />
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0}
              >
                <FiShoppingCart />
                Ajouter au panier
              </button>
              
              <button className={`wishlist-btn ${liked ? 'active' : ''}`} onClick={handleWishlistToggle}>
                <FiHeart />
              </button>
              
              <div className="share-container">
                <button className="share-btn" onClick={handleShareClick} title="Partager">
                  <FiShare2 />
                </button>
                {showShareMenu && (
                  <div className="share-menu">
                    <button className="share-item whatsapp" onClick={() => openShare('whatsapp')} title="Partager sur WhatsApp">
                      <FaWhatsapp />
                      <span>WhatsApp</span>
                    </button>
                    <button className="share-item facebook" onClick={() => openShare('facebook')} title="Partager sur Facebook">
                      <FaFacebookF />
                      <span>Facebook</span>
                    </button>
                    <button className="share-item telegram" onClick={() => openShare('telegram')} title="Partager sur Telegram">
                      <FaTelegramPlane />
                      <span>Telegram</span>
                    </button>
                    <button className="share-item instagram" onClick={() => openShare('instagram')} title="Partager sur Instagram">
                      <FaInstagram />
                      <span>Instagram</span>
                    </button>
                    <button className="share-item tiktok" onClick={() => openShare('tiktok')} title="Partager sur TikTok">
                      <FaTiktok />
                      <span>TikTok</span>
                    </button>
                    <button className="share-item copy" onClick={copyLink} title="Copier le lien">
                      <FaLink />
                      <span>Copier</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock info */}
          {selectedVariant && (
            <div className="stock-info">
              {selectedVariant.stock > 0 ? (
                <span className="in-stock">
                  ✓ En stock ({selectedVariant.stock} disponible{selectedVariant.stock > 1 ? 's' : ''})
                </span>
              ) : (
                <span className="out-of-stock">
                  ✗ Rupture de stock
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Avis clients */}
      {currentProduct.reviews && currentProduct.reviews.length > 0 && (
        <div className="product-reviews">
          <h2>Avis clients</h2>
          <div className="reviews-list">
            {currentProduct.reviews.slice(0, 5).map((review, index) => (
              <div key={index} className="review-item">
                <div className="review-header">
                  <div className="reviewer-name">{review.user?.firstName || 'Client'}</div>
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className={i < review.rating ? 'filled' : ''} />
                    ))}
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>
                <div className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informations détaillées */}
      <div className="product-details-expanded">
        <h2>Informations détaillées</h2>

        <div className="details-grid">
          <div className="details-section">
            <h3>Informations</h3>
            <p><strong>Nom:</strong> {currentProduct.name}</p>
            {currentProduct.shortDescription && (
              <p><strong>Description courte:</strong> {currentProduct.shortDescription}</p>
            )}
            <p><strong>Catégorie:</strong> {currentProduct.category}</p>
            {currentProduct.subcategory && (
              <p><strong>Sous-catégorie:</strong> {currentProduct.subcategory}</p>
            )}
            {currentProduct.brand && (
              <p><strong>Marque:</strong> {currentProduct.brand}</p>
            )}
            {currentProduct.sku && (
              <p><strong>SKU:</strong> {currentProduct.sku}</p>
            )}
            {Array.isArray(currentProduct.tags) && currentProduct.tags.length > 0 && (
              <p><strong>Tags:</strong> {joinList(currentProduct.tags)}</p>
            )}
            {currentProduct.status && (
              <p><strong>Statut:</strong> {currentProduct.status}</p>
            )}
            <p><strong>En stock:</strong> {currentProduct.inStock ? 'Oui' : 'Non'}</p>
            <p><strong>Stock total:</strong> {currentProduct.totalStock ?? 0}</p>
            {currentProduct.isNew !== undefined && (
              <p><strong>Nouveau:</strong> {currentProduct.isNew ? 'Oui' : 'Non'}</p>
            )}
            {currentProduct.newUntil && (
              <p><strong>Nouveau jusqu’au:</strong> {formatDate(currentProduct.newUntil)}</p>
            )}
          </div>

          <div className="details-section">
            <h3>Prix</h3>
            <p><strong>Devise:</strong> {currentProduct.price?.currency || 'EUR'}</p>
            <p><strong>Prix de base:</strong> {formatPrice(currentProduct.price?.base)} €</p>
            {currentProduct.price?.sale != null && (
              <p><strong>Prix promo:</strong> {formatPrice(currentProduct.price?.sale)} €</p>
            )}
            {currentProduct.discountPercentage != null && (
              <p><strong>Réduction:</strong> {currentProduct.discountPercentage}%</p>
            )}
            <p><strong>Prix effectif:</strong> {formatPrice(effectiveProductPrice)} €</p>
            {Array.isArray(currentProduct.variants) && currentProduct.variants.length > 0 && (
              <div className="variants-summary">
                <strong>Variantes:</strong>
                <ul>
                  {currentProduct.variants.map((v) => (
                    <li key={v._id || `${v.size}-${v?.color?.name}-${v.material}`}>
                      {(v.size ? `Taille ${v.size}` : '')}
                      {v?.color?.name ? `, Couleur ${v.color.name}` : ''}
                      {v.material ? `, Matière ${v.material}` : ''}
                      {typeof v.stock === 'number' ? `, Stock ${v.stock}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="details-section">
            <h3>Évaluations</h3>
            <p><strong>Moyenne (avis):</strong> {averageRating.toFixed(1)} / 5</p>
            {currentProduct.ratings?.average != null && (
              <p><strong>Moyenne (modèle):</strong> {currentProduct.ratings.average} / 5</p>
            )}
            {currentProduct.ratings?.count != null && (
              <p><strong>Nombre d’évaluations:</strong> {currentProduct.ratings.count}</p>
            )}
          </div>

          <div className="details-section">
            <h3>Personnalisation</h3>
            <p><strong>Personnalisable:</strong> {isCustomizable ? 'Oui' : 'Non'}</p>
            {currentProduct.customization?.options && (
              <ul>
                <li>Texte: {currentProduct.customization.options.text?.enabled ? 'Oui' : 'Non'}</li>
                <li>Image: {currentProduct.customization.options.image?.enabled ? 'Oui' : 'Non'}</li>
                <li>Broderie: {currentProduct.customization.options.embroidery?.enabled ? 'Oui' : 'Non'}</li>
              </ul>
            )}
          </div>

          <div className="details-section">
            <h3>Spécifications</h3>
            {currentProduct.specifications?.material && (
              <p><strong>Matière:</strong> {currentProduct.specifications.material}</p>
            )}
            {Array.isArray(currentProduct.specifications?.features) && currentProduct.specifications.features.length > 0 && (
              <p><strong>Caractéristiques:</strong> {joinList(currentProduct.specifications.features)}</p>
            )}
            {Array.isArray(currentProduct.specifications?.careInstructions) && currentProduct.specifications.careInstructions.length > 0 && (
              <p><strong>Entretien:</strong> {joinList(currentProduct.specifications.careInstructions)}</p>
            )}
            {currentProduct.specifications?.origin && (
              <p><strong>Origine:</strong> {currentProduct.specifications.origin}</p>
            )}
          </div>

          <div className="details-section">
            <h3>Expédition</h3>
            {currentProduct.shipping?.weight?.value != null && (
              <p><strong>Poids:</strong> {currentProduct.shipping.weight.value} {currentProduct.shipping.weight.unit || 'g'}</p>
            )}
            {(currentProduct.shipping?.dimensions?.length != null || currentProduct.shipping?.dimensions?.width != null || currentProduct.shipping?.dimensions?.height != null) && (
              <p><strong>Dimensions:</strong> {currentProduct.shipping?.dimensions?.length ?? '-'} × {currentProduct.shipping?.dimensions?.width ?? '-'} × {currentProduct.shipping?.dimensions?.height ?? '-'} {currentProduct.shipping?.dimensions?.unit || 'cm'}</p>
            )}
            {currentProduct.shipping?.freeShippingEligible !== undefined && (
              <p><strong>Livraison gratuite:</strong> {currentProduct.shipping.freeShippingEligible ? 'Oui' : 'Non'}</p>
            )}
            {currentProduct.shipping?.shippingClass && (
              <p><strong>Classe de livraison:</strong> {currentProduct.shipping.shippingClass}</p>
            )}
          </div>

          <div className="details-section">
            <h3>SEO</h3>
            {currentProduct.seo?.slug && (
              <p><strong>Slug:</strong> {currentProduct.seo.slug}</p>
            )}
            {currentProduct.seo?.metaTitle && (
              <p><strong>Meta titre:</strong> {currentProduct.seo.metaTitle}</p>
            )}
            {currentProduct.seo?.metaDescription && (
              <p><strong>Meta description:</strong> {currentProduct.seo.metaDescription}</p>
            )}
            {Array.isArray(currentProduct.seo?.keywords) && currentProduct.seo.keywords.length > 0 && (
              <p><strong>Mots-clés:</strong> {joinList(currentProduct.seo.keywords)}</p>
            )}
          </div>

          <div className="details-section">
            <h3>Journal</h3>
            <p><strong>Créé le:</strong> {formatDate(currentProduct.createdAt)}</p>
            <p><strong>Mis à jour le:</strong> {formatDate(currentProduct.updatedAt)}</p>
            {currentProduct.analytics && (
              <>
                <p><strong>Vues:</strong> {currentProduct.analytics.views ?? 0}</p>
                <p><strong>Ajouts au panier:</strong> {currentProduct.analytics.addedToCart ?? 0}</p>
                <p><strong>Achats:</strong> {currentProduct.analytics.purchases ?? 0}</p>
                <p><strong>Ajouts wishlist:</strong> {currentProduct.analytics.wishlistAdds ?? 0}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;