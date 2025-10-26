import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaHeart, FaEye, FaStar } from 'react-icons/fa';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import './ProductCard.css';
import { usersAPI } from '../../services/api';

const ProductCard = ({ product, activeColor }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [liked, setLiked] = useState(false);

  // Sélection d'image principale en fonction de la couleur active
  const getPrimaryImageUrl = () => {
    const imgs = Array.isArray(product?.images) ? product.images : [];
    const normColor = String(activeColor || '').toLowerCase();
    if (normColor) {
      const byColorFront = imgs.find(img => String(img?.color || '').toLowerCase() === normColor && String(img?.side || '').toLowerCase() === 'front');
      if (byColorFront?.url) return byColorFront.url;
      const byColorAny = imgs.find(img => String(img?.color || '').toLowerCase() === normColor);
      if (byColorAny?.url) return byColorAny.url;
    }
    const primary = imgs.find(img => img?.isPrimary && img?.url);
    if (primary?.url) return primary.url;
    return imgs[0]?.url || product?.image || '/api/placeholder/300/300';
  };

  const primaryImageUrl = getPrimaryImageUrl();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const effectivePrice = (product?.effectivePrice ?? product?.price?.sale ?? product?.price?.base ?? product?.price ?? 0);

    const cartItem = {
      id: product._id,
      name: product.name,
      price: effectivePrice,
      image: primaryImageUrl,
      category: product.category,
      quantity: 1,
      color: (activeColor || (Array.isArray(product?.colors) ? product.colors[0] : null)),
      size: Array.isArray(product?.sizes) ? product.sizes[0] : null
    };

    dispatch(addToCart(cartItem));
    toast.success(`${product.name} ajouté au panier !`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  useEffect(() => {
    if (user && Array.isArray(user.wishlist)) {
      const isLiked = user.wishlist.some(id => id === product._id);
      setLiked(isLiked);
    }
  }, [user, product?._id]);

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Connectez-vous pour gérer vos favoris');
      navigate('/auth');
      return;
    }

    try {
      if (!liked) {
        await usersAPI.addToWishlist(product._id);
        setLiked(true);
        toast.success('Ajouté aux favoris');
      } else {
        await usersAPI.removeFromWishlist(product._id);
        setLiked(false);
        toast.info('Retiré des favoris');
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Erreur lors de la mise à jour des favoris';
      toast.error(message);
    }
  };

  const handleView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product?._id) {
      navigate(`/product/${product._id}`);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="star filled" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="star half" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="star empty" />);
    }

    return stars;
  };

  // Affichage lisible du genre
  const formatGender = (g) => {
    if (!g) return '';
    const map = { unisexe: 'Unisexe', homme: 'Homme', femme: 'Femme', enfant: 'Enfant' };
    const key = String(g).toLowerCase();
    return map[key] || (key.charAt(0).toUpperCase() + key.slice(1));
  };

  return (
    <motion.div
      className="product-card"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/product/${product._id}`} className="product-link">
        <div
          className="product-image-container"
          style={{
            backgroundImage: `url(${primaryImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <img
            src={primaryImageUrl}
            alt={product.name}
            className="product-image"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 300px"
          />
          
          {/* Badge de réduction */}
          {product?.discountPercentage > 0 && (
            <div className="discount-badge">
              -{product.discountPercentage}%
            </div>
          )}

          {/* Badge nouveau */}
          {product.isNew && (
            <div className="new-badge">
              Nouveau
            </div>
          )}

          {/* Overlay avec actions */}
          <div className="product-overlay">
            <div className="product-actions">
              <motion.button
                className={`action-btn wishlist-btn ${liked ? 'active' : ''}`}
                onClick={handleWishlist}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <FaHeart />
              </motion.button>
              
              <motion.button
                className="action-btn view-btn"
                onClick={handleView}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Voir les détails"
              >
                <FaEye />
              </motion.button>
              
              <motion.button
                className="action-btn cart-btn"
                onClick={handleAddToCart}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Ajouter au panier"
              >
                <FaShoppingCart />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="product-info">
          {/* Catégorie */}
          <div className="product-category">
            {product.category}
          </div>

          {/* Genre */}
          {/* {product?.gender && (
            <div className="product-gender">Genr: {formatGender(product.gender)}</div>
          )} */}

          {/* Nom du produit */}
          <h3 className="product-name">
            {product.name}
          </h3>

          {/* Description courte */}
          {product.description && (
            <p className="product-description">
              {product.description.length > 80 
                ? `${product.description.substring(0, 80)}...` 
                : product.description
              }
            </p>
          )}

          {/* Évaluation */}
          {product.rating && (
            <div className="product-rating">
              <div className="stars">
                {renderStars(product.rating)}
              </div>
              <span className="rating-text">
                ({product.reviewCount || 0} avis)
              </span>
            </div>
          )}

          {/* Prix */}
          <div className="product-pricing">
            {(() => {
              const priceCurrent = (product?.effectivePrice ?? product?.price?.sale ?? product?.price?.base ?? product?.price ?? 0);
              const hasDiscount = (product?.discountPercentage ?? 0) > 0;
              const basePrice = (product?.price?.base ?? product?.price ?? priceCurrent);
              return hasDiscount ? (
                <>
                  <span className="original-price">{formatPrice(basePrice)}</span>
                  <span className="current-price">{formatPrice(priceCurrent)}</span>
                </>
              ) : (
                <span className="current-price">{formatPrice(priceCurrent)}</span>
              );
            })()}
          </div>

          {/* Disponibilité */}
          <div className="product-availability">
            {(product?.totalStock ?? 0) > 0 ? (
              <span className="in-stock">
                ✓ En stock ({product.totalStock} disponibles)
              </span>
            ) : (
              <span className="out-of-stock">
                ✗ Rupture de stock
              </span>
            )}
          </div>

          {/* Options de personnalisation */}
          {product.customizable && (
            <div className="customization-badge">
              <span className="customize-icon">🎨</span>
              Personnalisable
            </div>
          )}
        </div>
      </Link>

      {/* Bouton d'ajout au panier en bas */}
      <div className="product-footer">
        <motion.button
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          disabled={(product?.totalStock ?? 0) === 0}
          whileHover={{ scale: (product?.totalStock ?? 0) > 0 ? 1.02 : 1 }}
          whileTap={{ scale: (product?.totalStock ?? 0) > 0 ? 0.98 : 1 }}
        >
          <FaShoppingCart />
          {(product?.totalStock ?? 0) > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;