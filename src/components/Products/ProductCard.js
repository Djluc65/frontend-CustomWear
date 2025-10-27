import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaHeart, FaEye, FaStar } from 'react-icons/fa';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
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
      stars.push(<FaStar key={i} className="w-4 h-4" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="w-4 h-4 opacity-70" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="w-4 h-4 opacity-40" />);
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
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition flex flex-col overflow-hidden"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
    >
      <Link to={`/product/${product._id}`} className="no-underline text-inherit">
        <div className="relative w-full h-56 sm:h-64 bg-gray-100">
          <img
            src={primaryImageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 300px"
          />

          {product?.discountPercentage > 0 && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs rounded">
              -{product.discountPercentage}%
            </div>
          )}

          {product.isNew && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
              Nouveau
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition">
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <motion.button
                className={`p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white ${liked ? 'ring-2 ring-pink-500' : ''}`}
                onClick={handleWishlist}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <FaHeart />
              </motion.button>

              <motion.button
                className="p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white"
                onClick={handleView}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Voir les détails"
              >
                <FaEye />
              </motion.button>

              <motion.button
                className="p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white"
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

        <div className="p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            {product.category}
          </div>

          {/* {product?.gender && (
            <div className="text-xs text-slate-600">Genre: {formatGender(product.gender)}</div>
          )} */}

          <h3 className="text-base font-semibold text-slate-900 mt-1">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-sm text-slate-700 mt-1">
              {product.description.length > 80 
                ? `${product.description.substring(0, 80)}...` 
                : product.description
              }
            </p>
          )}

          {product.rating && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-yellow-500">
                {renderStars(product.rating)}
              </div>
              <span className="text-xs text-slate-600">
                ({product.reviewCount || 0} avis)
              </span>
            </div>
          )}

          <div className="mt-2 flex items-baseline gap-2">
            {(() => {
              const priceCurrent = (product?.effectivePrice ?? product?.price?.sale ?? product?.price?.base ?? product?.price ?? 0);
              const hasDiscount = (product?.discountPercentage ?? 0) > 0;
              const basePrice = (product?.price?.base ?? product?.price ?? priceCurrent);
              return hasDiscount ? (
                <>
                  <span className="text-sm line-through text-slate-500">{formatPrice(basePrice)}</span>
                  <span className="text-lg font-bold text-slate-900">{formatPrice(priceCurrent)}</span>
                </>
              ) : (
                <span className="text-lg font-bold text-slate-900">{formatPrice(priceCurrent)}</span>
              );
            })()}
          </div>

          <div className="mt-2">
            {(product?.totalStock ?? 0) > 0 ? (
              <span className="text-xs text-green-700 font-medium">
                ✓ En stock ({product.totalStock} disponibles)
              </span>
            ) : (
              <span className="text-xs text-red-700 font-medium">
                ✗ Rupture de stock
              </span>
            )}
          </div>

          {product.customizable && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-slate-700">
              <span>🎨</span>
              <span>Personnalisable</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 border-t">
        <motion.button
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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