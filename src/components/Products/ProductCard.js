import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaHeart, FaEye, FaStar } from 'react-icons/fa';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const effectivePrice = (product?.price?.sale ?? product?.price?.base ?? 0);
    const primaryImageUrl = product?.images?.[0]?.url || product?.image || '/api/placeholder/300/300';

    const cartItem = {
      id: product._id,
      name: product.name,
      price: effectivePrice,
      image: primaryImageUrl,
      category: product.category,
      quantity: 1
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

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info('Fonctionnalité de liste de souhaits bientôt disponible !');
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

  return (
    <motion.div
      className="product-card"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/product/${product._id}`} className="product-link">
        <div className="product-image-container">
          <img
            src={product?.images?.[0]?.url || product?.image || '/api/placeholder/300/300'}
            alt={product.name}
            className="product-image"
            loading="lazy"
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
                className="action-btn wishlist-btn"
                onClick={handleWishlist}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Ajouter aux favoris"
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
            {product?.price?.sale && product?.price?.base && product.price.sale < product.price.base ? (
              <>
                <span className="original-price">
                  {formatPrice(product.price.base)}
                </span>
                <span className="current-price">
                  {formatPrice(product.price.sale)}
                </span>
              </>
            ) : (
              <span className="current-price">
                {formatPrice(product?.price?.sale ?? product?.price?.base ?? 0)}
              </span>
            )}
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