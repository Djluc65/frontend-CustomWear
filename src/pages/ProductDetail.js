import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { productsAPI } from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { currentProduct, isLoading, error } = useSelector(state => state.products);
  const { user } = useSelector(state => state.auth);
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [customization, setCustomization] = useState({
    text: '',
    color: '#000000',
    position: 'center'
  });
  const [showCustomization, setShowCustomization] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  // État du formulaire d'avis
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProduct && currentProduct.variants && currentProduct.variants.length > 0) {
      const params = new URLSearchParams(location.search || '');
      const preColor = params.get('color');
      const preSize = params.get('size');
      const preImg = params.get('img');

      let initial = currentProduct.variants.find(v => {
        const colorOk = preColor ? (v.color === preColor) : true;
        const sizeOk = preSize ? (v.size === preSize) : true;
        return colorOk && sizeOk;
      });
      if (!initial) initial = currentProduct.variants[0];
      setSelectedVariant(initial);

      if (preImg) {
        setSelectedImageUrl(preImg);
      }
    }
    if (currentProduct) {
      setLiked(Boolean(currentProduct.likedByUser));
    }
  }, [currentProduct, location.search]);

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Veuillez sélectionner une variante');
      return;
    }

    const cartItem = {
      productId: currentProduct._id,
      variantId: selectedVariant._id,
      quantity,
      customization: showCustomization ? customization : null,
      product: currentProduct,
      image: selectedCartImageUrl,
      color: selectedColorName,
      size: selectedVariant?.size
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


  const reviews = Array.isArray(currentProduct?.reviews) ? currentProduct.reviews : [];
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  // L’utilisateur a-t-il déjà laissé un avis ?
  const userHasReviewed = !!user && reviews.some(r => String(r.user?._id || r.user) === String(user._id));

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

  // Affichage lisible du genre
  const formatGender = (g) => {
    if (!g) return '';
    const map = { unisexe: 'Unisexe', homme: 'Homme', femme: 'Femme', enfant: 'Enfant' };
    const key = String(g).toLowerCase();
    return map[key] || (key.charAt(0).toUpperCase() + key.slice(1));
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

  // Effective product-level price (supports number or object)
  const effectiveProductPrice = (
    currentProduct?.effectivePrice ?? (
      (typeof currentProduct?.price === 'number')
        ? currentProduct.price
        : (currentProduct?.price?.sale ?? currentProduct?.price?.base ?? null)
    )
  );

  // Couleur sélectionnée (nom) et images à afficher selon la couleur
  const selectedColorName = getColorName(selectedVariant?.color);

  // Normaliser toutes les images du produit (chaînes ou objets)
  const allImages = Array.isArray(currentProduct?.images)
    ? currentProduct.images
        .map(img => {
          if (!img) return null;
          if (typeof img === 'string') return { url: img };
          return {
            url: img.url || img.secure_url || '',
            color: typeof img.color === 'object' ? (img.color?.name || '') : (img.color || ''),
            side: img.side || '',
            isPrimary: Boolean(img.isPrimary),
          };
        })
        .filter(i => i && i.url)
    : [];

  // Filtrer d'abord les images sur la couleur sélectionnée (fallback sur toutes si aucune)
  const colorFilteredImages = selectedColorName
    ? allImages.filter(img => img.color === selectedColorName)
    : allImages;
  const sourceImages = colorFilteredImages.length > 0 ? colorFilteredImages : allImages;

  // Trier: prioriser la couleur sélectionnée, le côté 'front', puis primaire
  const displayImages = [...sourceImages].sort((a, b) => {
    const score = (img) => {
      const colorScore = selectedColorName && img.color === selectedColorName ? 2 : 0;
      const frontScore = String(img.side).toLowerCase() === 'front' ? 1 : 0;
      const primaryScore = img.isPrimary ? 3 : 0;
      return primaryScore + colorScore + frontScore;
    };
    return score(b) - score(a);
  });

  // --- Ajouts: sélecteurs Couleur/Taille et lien avec vignettes ---
  const unique = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
  const colorFromImage = (img) => (typeof img?.color === 'string' ? img.color : (img?.color?.name || ''));

  const availableColors = unique((currentProduct?.variants || []).map(v => getColorName(v.color)));
  const availableSizesForColor = (colorName) => {
    const variants = Array.isArray(currentProduct?.variants) ? currentProduct.variants : [];
    return unique(variants.filter(v => getColorName(v.color) === colorName).map(v => v.size));
  };
  const availableSizes = selectedColorName ? availableSizesForColor(selectedColorName) : unique((currentProduct?.variants || []).map(v => v.size));

  const findVariant = (colorName, size) => {
    const variants = Array.isArray(currentProduct?.variants) ? currentProduct.variants : [];
    const byColorAndSize = variants.find(v => getColorName(v.color) === colorName && v.size === size);
    if (byColorAndSize) return byColorAndSize;
    if (colorName) {
      const byColor = variants.find(v => getColorName(v.color) === colorName);
      if (byColor) return byColor;
    }
    if (size) {
      const bySize = variants.find(v => v.size === size);
      if (bySize) return bySize;
    }
    return variants[0] || null;
  };

  const handleColorSelect = (colorName) => {
    const desiredSize = selectedVariant?.size;
    const next = findVariant(colorName, desiredSize);
    if (next) {
      setSelectedVariant(next);
      // Réinitialiser l’image sélectionnée pour afficher la première vignette de la couleur
      setSelectedImage(0);
      setSelectedImageUrl(null);
    }
  };

  const handleSizeSelect = (size) => {
    const colorName = selectedColorName || availableColors[0] || '';
    const next = findVariant(colorName, size);
    if (next) setSelectedVariant(next);
  };

  const handleThumbnailClick = (image, index) => {
    setSelectedImage(index);
    setSelectedImageUrl(getImageUrl(image));
    const imgColor = colorFromImage(image);
    if (imgColor && imgColor !== selectedColorName) {
      handleColorSelect(imgColor);
    }
  };

  // Rendre cliquables les vignettes de “Toutes les images” et sélectionner couleur
  const handleAllImageClick = (image) => {
    const targetUrl = getImageUrl(image);
    const targetColor = colorFromImage(image);

    // Met à jour la variante si la couleur diffère
    if (targetColor && targetColor !== selectedColorName) {
      const nextVar = findVariant(targetColor, selectedVariant?.size);
      if (nextVar) setSelectedVariant(nextVar);
    }

    // Définit l’URL et tente de positionner l’index sur l’image cliquée
    setSelectedImageUrl(targetUrl);

    const futureSource = targetColor
      ? allImages.filter(img => colorFromImage(img) === targetColor)
      : allImages;

    const score = (img, preferredColor) => {
      const colorScore = preferredColor && colorFromImage(img) === preferredColor ? 2 : 0;
      const frontScore = String(img.side).toLowerCase() === 'front' ? 1 : 0;
      const primaryScore = img.isPrimary ? 3 : 0;
      return primaryScore + colorScore + frontScore;
    };

    const futureDisplay = [...futureSource].sort((a, b) => {
      return score(b, targetColor) - score(a, targetColor);
    });

    const idx = futureDisplay.findIndex(img => getImageUrl(img) === targetUrl);
    setSelectedImage(idx >= 0 ? idx : 0);
  };

  const selectedCartImageUrl = displayImages.length > 0
    ? getImageUrl(displayImages[Math.min(selectedImage, displayImages.length - 1)])
    : getImageUrl(currentProduct?.images?.[0]);

  // Stabiliser l'image sélectionnée quand l'ordre/liste change
  useEffect(() => {
    if (!Array.isArray(displayImages) || displayImages.length === 0) {
      setSelectedImage(0);
      return;
    }
    if (selectedImageUrl) {
      const idx = displayImages.findIndex(img => getImageUrl(img) === selectedImageUrl);
      if (idx >= 0) {
        if (idx !== selectedImage) setSelectedImage(idx);
        return;
      }
      const safeIndex = Math.min(selectedImage, displayImages.length - 1);
      if (safeIndex !== selectedImage) setSelectedImage(safeIndex);
    } else {
      if (selectedImage >= displayImages.length) setSelectedImage(0);
    }
  }, [displayImages, selectedImageUrl]);

  // Retours précoces placés après hooks pour respecter les règles
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
        <button onClick={() => navigate(location.state?.fromProducts || '/products')}>
          Retour aux produits
        </button>
      </div>
    );
  }

  const handleBuyNow = () => {
    // Ajoute au panier la sélection actuelle puis va au paiement
    handleAddToCart();
    navigate('/checkout');
  };

  // Soumission d’un avis
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Veuillez vous connecter pour laisser un avis.');
      navigate('/auth');
      return;
    }
    if (userHasReviewed) {
      toast.info('Vous avez déjà laissé un avis pour ce produit.');
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      toast.error('Veuillez choisir une note entre 1 et 5.');
      return;
    }
    if (!reviewComment.trim()) {
      toast.error('Veuillez écrire un commentaire.');
      return;
    }
    try {
      setIsSubmittingReview(true);
      await productsAPI.addReview(id, { rating: reviewRating, comment: reviewComment.trim() });
      toast.success('Merci pour votre avis !');
      setReviewComment('');
      setReviewRating(0);
      // Recharger le produit pour voir l’avis ajouté
      dispatch(fetchProductById(id));
    } catch (err) {
      const msg = err?.response?.data?.message || 'Impossible d’envoyer votre avis';
      toast.error(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="product-detail">
      <div className="product-detail-container">
        {/* Images du produit */}
        <div className="product-images">
          <div className="main-image">
            <ProductSlideshow
              images={displayImages}
              startIndex={selectedImage}
              onIndexChange={setSelectedImage}
              autoPlay={false}
              interval={3000}
              transition="fade"
            />
          </div>
          <div className="image-thumbnails">
            {displayImages.map((image, index) => (
              <button
                key={index}
                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(image, index)}
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
              <span product-avis>({currentProduct.reviews?.length || 0} avis)</span>
            </div>
          </div>

          <div className="product-price">
            {(() => {
              const hasDiscount = (currentProduct?.discountPercentage ?? 0) > 0;
              const basePrice = (currentProduct?.price?.base ?? currentProduct?.price ?? effectiveProductPrice);
              const finalPrice = (effectiveProductPrice ?? basePrice);
              if (finalPrice != null) {
                return hasDiscount && basePrice != null && basePrice !== finalPrice ? (
                  <>
                    <span className="compare-price">{formatPrice(basePrice)} €</span>
                    <span className="current-price">{formatPrice(finalPrice)} €</span>
                  </>
                ) : (
                  <span className="current-price">{formatPrice(finalPrice)} €</span>
                );
              }
              return <span className="price-range">Prix indisponible</span>;
            })()}
          </div>

          <div className="product-description">
            <p>{currentProduct.description}</p>
          </div>

          {/* Métadonnées du produit */}
          <div className="product-meta">
            <p><strong>Catégorie:</strong> {currentProduct.category}</p>
            {currentProduct.gender && (
              <p><strong>Genre:</strong> {formatGender(currentProduct.gender)}</p>
            )}
            {Array.isArray(currentProduct.colors) && currentProduct.colors.length > 0 && (
              <p><strong>Couleurs:</strong> {joinList(currentProduct.colors)}</p>
            )}
            {selectedVariant?.size && (
              <p><strong>Taille sélectionnée:</strong> {selectedVariant.size}</p>
            )}
            {currentProduct.sku && (
              <p><strong>SKU:</strong> {currentProduct.sku}</p>
            )}
            <p><strong>Quantité totale:</strong> {currentProduct.totalStock ?? 0}</p>
          </div>

          {/* Sélecteurs Couleur et Taille */}
          {availableColors.length > 0 && (
            <div className="product-variants">
              <h3 className="variant-color">Couleur</h3>
              <div className="variants-grid">
                {availableColors.map((color) => (
                  <button
                     className={`variant-option ${selectedColorName === color ? 'selected' : ''}`}
                     onClick={() => handleColorSelect(color)}
                  >
                    <div className="variant-info">
                      <span className="variant-name">{color}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableSizes.length > 0 && (
            <div className="product-variants">
              <h3 className="variant-size">Taille</h3>
              <div className="variants-grid-size">
                {availableSizes.map((size) => {
                  const candidate = findVariant(selectedColorName || availableColors[0] || '', size);
                  const disabled = !candidate;
                  const selected = selectedVariant?.size === size;
                  return (
                    <button
                       className={`variant-option ${selected ? 'selected' : ''}`}
                       onClick={() => handleSizeSelect(size)}
                       disabled={disabled}
                     >
                      <div className="variant-info">
                        <span className="variant-name">{`${size}`}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sélecteur de quantité */}
          <div className="quantity-selector">
            <label style={{ fontWeight: 'bold', fontSize: '18px' }}>Quantité</label>
            <div className="quantity-controls">
              <button onClick={() => handleQuantityChange(-1)} aria-label="Diminuer quantité">
                <FiMinus />
              </button>
              <span>{quantity}</span>
              <button onClick={() => handleQuantityChange(1)} aria-label="Augmenter quantité">
                <FiPlus />
              </button>
            </div>
          </div>

          {/* Boutons d’action */}
          <div className="action-buttons">
            <button
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!selectedVariant}
              title="Ajouter au panier"
            >
              <FiShoppingCart /> Ajouter au panier
            </button>
            <button
              className="add-to-cart-btn buy-now-btn"
              onClick={handleBuyNow}
              disabled={!selectedVariant}
              title="Acheter maintenant"
            >
              Acheter maintenant
            </button>
            <button
              className={`wishlist-btn ${liked ? 'active' : ''}`}
              onClick={handleWishlistToggle}
              aria-pressed={liked}
              title={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <FiHeart />
            </button>
            <button className="share-btn" onClick={handleShareClick} title="Partager">
              <FiShare2 />
            </button>
          </div>
        </div>
        {/* Galerie complète des images */}
        {allImages.length > 0 && (
          <div className="all-images-gallery">
            <h3>Toutes les images</h3>
            <div className="all-images-grid">
              {allImages.map((image, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="all-image-item"
                  onClick={() => handleAllImageClick(image)}
                  aria-label={`Afficher image ${idx + 1}`}
                >
                  <img src={getImageUrl(image)} alt={`${currentProduct.name} ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>
        )}
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

      {/* Formulaire pour laisser un avis */}
      <div className="review-form">
        <h3>Laisser un avis</h3>
        {!user && (
          <p className="auth-warning">Connectez-vous pour donner votre avis.</p>
        )}
        {user && userHasReviewed && (
          <p className="auth-warning">Vous avez déjà laissé un avis pour ce produit.</p>
        )}
        {user && !userHasReviewed && (
          <form onSubmit={handleSubmitReview}>
            <div className="rating-input">
              {[1,2,3,4,5].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`star ${reviewRating >= val ? 'selected' : ''}`}
                  onClick={() => setReviewRating(val)}
                  aria-label={`Note ${val}`}
                >
                  <FiStar />
                </button>
              ))}
              <span className="rating-label">{reviewRating > 0 ? `${reviewRating}/5` : 'Choisissez une note'}</span>
            </div>
            <div className="comment-input">
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Votre avis sur le produit"
                rows={4}
              />
            </div>
            <button className="submit-review-btn" type="submit" disabled={isSubmittingReview}>
              {isSubmittingReview ? 'Envoi…' : 'Envoyer mon avis'}
            </button>
          </form>
        )}
      </div>
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