import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaHeart, FaEye, FaStar } from 'react-icons/fa';
import { FiPackage } from 'react-icons/fi';
import { addToCart } from '../../store/slices/cartSlice';
import { toast } from 'react-toastify';
import { usersAPI } from '../../services/api';
import './ProductCard.css';

const COLOR_MAP = {
  Noir: '#111111',
  Blanc: '#f5f5f5',
  Rouge: '#DC2626',
  Bleu: '#1E3A8A',
  Marron: '#8B4513',
  Rose: '#FFC0CB',
  Jaune: '#FFD700',
  Vert: '#16a34a',
  Mauve: '#7c3aed',
  Gris: '#9ca3af',
};

const ProductCard = ({ product, activeColor }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [liked, setLiked] = useState(false);
  const [selectedColor, setSelectedColor] = useState(activeColor || null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setSelectedColor(activeColor || null);
  }, [activeColor]);

  const availableColors = useMemo(() => {
    if (Array.isArray(product?.colors) && product.colors.length > 0) return product.colors;
    if (Array.isArray(product?.variants)) {
      return Array.from(new Set(product.variants.map(v =>
        typeof v?.color === 'string' ? v.color : v?.color?.name
      ).filter(Boolean)));
    }
    return [];
  }, [product]);

  const availableSizes = useMemo(() => {
    if (Array.isArray(product?.sizes) && product.sizes.length > 0) return product.sizes;
    if (Array.isArray(product?.variants)) {
      return Array.from(new Set(product.variants.map(v => v?.size).filter(Boolean)));
    }
    return [];
  }, [product]);

  const allImages = useMemo(() => {
    const imgs = product?.images;
    if (!imgs || !imgs.length) return [];
    const normalized = (typeof imgs[0] === 'object')
      ? imgs.filter(i => i?.url || i?.secure_url)
      : imgs.map(url => ({ url }));

    const normSelectedColor = selectedColor ? String(selectedColor).toLowerCase() : '';
    const score = (img) => {
      const colorVal = typeof img?.color === 'string' ? img.color : (img?.color?.name || '');
      const colorScore = normSelectedColor && String(colorVal).toLowerCase() === normSelectedColor ? 2 : 0;
      const frontScore = String(img?.side || '').toLowerCase() === 'front' ? 1 : 0;
      const primaryScore = img?.isPrimary ? 3 : 0;
      return primaryScore + colorScore + frontScore;
    };

    return [...normalized].sort((a, b) => score(b) - score(a));
  }, [product, selectedColor]);

  const displayImage = useMemo(() => {
    if (allImages[activeIdx]) {
      const img = allImages[activeIdx];
      return typeof img === 'string' ? img : (img.url || img.secure_url || null);
    }
    if (Array.isArray(product?.images) && product.images.length > 0) {
      if (selectedColor && typeof product.images[0] === 'object') {
        const norm = String(selectedColor).toLowerCase();
        const colorImg = product.images.find(img =>
          String(img?.color || '').toLowerCase() === norm && String(img?.side || '').toLowerCase() === 'front'
        );
        if (colorImg) return colorImg.url || colorImg.secure_url || null;
      }
      if (typeof product.images[0] === 'object') {
        const primary = product.images.find(i => i?.isPrimary && String(i?.side || '').toLowerCase() === 'front')
          || product.images.find(i => i?.isPrimary)
          || product.images.find(i => String(i?.side || '').toLowerCase() === 'front')
          || product.images[0];
        return primary?.url || primary?.secure_url || null;
      }
      return typeof product.images[0] === 'string' ? product.images[0] : null;
    }
    return product?.image || null;
  }, [product, selectedColor, activeIdx, allImages]);

  const stockCount = useMemo(() => {
    if (Number.isFinite(Number(product?.totalStock))) return Number(product.totalStock);
    if (Array.isArray(product?.variants)) {
      return product.variants.reduce((a, v) => a + (Number(v?.stock) || 0), 0);
    }
    return Number(product?.stock) || 0;
  }, [product]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const effectivePrice = (product?.effectivePrice ?? product?.price?.sale ?? product?.price?.base ?? product?.price ?? 0);

    const cartItem = {
      id: product._id,
      name: product.name,
      price: effectivePrice,
      image: displayImage,
      category: product.category,
      quantity: 1,
      color: selectedColor || activeColor || (Array.isArray(product?.colors) ? product.colors[0] : null),
      size: selectedSize || (Array.isArray(product?.sizes) ? product.sizes[0] : null)
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
      className="product-card rounded-lg shadow-sm hover:shadow transition flex flex-col overflow-hidden"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
    >
      <Link to={`/product/${product._id}`} className="no-underline text-inherit flex flex-col h-full">
        
        {/* ── IMAGE ── */} 
        <div className="pc-img-zone"> 
          <div className="pc-image-wrapper"> 
            {displayImage ? ( 
              <img 
                src={displayImage} 
                alt={product.name} 
                className="pc-image" 
                loading="lazy" 
                decoding="async" 
              /> 
            ) : ( 
              <div className="pc-image-placeholder"><FiPackage /></div> 
            )} 
          </div> 
    
          {product?.discountPercentage > 0 && ( 
            <span className="pc-badge pc-badge-sale">-{product.discountPercentage}%</span> 
          )} 
          {product.isNew && ( 
            <span className="pc-badge pc-badge-new">Nouveau</span> 
          )} 
    
          <div className="pc-overlay"> 
            <div className="pc-overlay-actions"> 
              <motion.button className={`pc-action-btn ${liked ? 'liked' : ''}`} onClick={handleWishlist} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}> 
                <FaHeart /> 
              </motion.button> 
              <motion.button className="pc-action-btn" onClick={handleView} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Voir les détails"> 
                <FaEye /> 
              </motion.button> 
              <motion.button className="pc-action-btn" onClick={handleAddToCart} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Ajouter au panier"> 
                <FaShoppingCart /> 
              </motion.button> 
            </div> 
          </div> 
        </div> 
    
        {/* ── COULEURS ── */} 
        {availableColors.length > 0 && ( 
          <div className="pc-colors"> 
            {availableColors.slice(0, 7).map(color => ( 
              <button 
                key={color} 
                className={`pc-color-dot ${selectedColor === color ? 'active' : ''}`} 
                style={{ backgroundColor: COLOR_MAP[color] || String(color).toLowerCase() }} 
                title={color} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setSelectedColor(prev => prev === color ? null : color);
                  setActiveIdx(0);
                }} 
              /> 
            ))} 
            {availableColors.length > 7 && ( 
              <span className="pc-colors-more">+{availableColors.length - 7}</span> 
            )} 
          </div> 
        )} 
    
        {/* ── TAILLES ── */} 
        {availableSizes.length > 0 && ( 
          <div className="pc-sizes"> 
            {availableSizes.slice(0, 6).map(size => ( 
              <button 
                key={size} 
                className={`pc-size-chip ${selectedSize === size ? 'active' : ''}`} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setSelectedSize(prev => prev === size ? null : size); 
                }} 
              > 
                {size} 
              </button> 
            ))} 
            {availableSizes.length > 6 && ( 
              <span className="pc-size-chip pc-size-more">+{availableSizes.length - 6}</span> 
            )} 
          </div> 
        )} 

        {/* ── Galerie toutes images ── */}
        {allImages.length > 1 && (
          <div className="pc-all-images">
            {allImages.slice(0, 6).map((img, i) => {
              const url = typeof img === 'string' ? img : (img.url || img.secure_url);
              const side = typeof img === 'object' ? img?.side : null;
              const colorVal = typeof img === 'object'
                ? (typeof img?.color === 'string' ? img.color : (img?.color?.name || ''))
                : '';
              return (
                <button
                  key={i}
                  className={`pc-img-thumb ${activeIdx === i ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveIdx(i);
                    if (colorVal) setSelectedColor(colorVal);
                  }}
                >
                  {url && <img src={url} alt={`vue ${i + 1}`} />}
                  {side && (
                    <span className="pc-img-thumb-label">{side}</span>
                  )}
                </button>
              );
            })}
            {allImages.length > 6 && (
              <span className="pc-img-more">+{allImages.length - 6}</span>
            )}
          </div>
        )}
    
        {/* ── INFOS PRODUIT ── */} 
        <div className="pc-info">
          <span className="pc-category">{product.category}</span>
          <h3 className="pc-name">{product.name}</h3>

          {product.description && (
            <p className="pc-desc">
              {product.description.length > 90
                ? `${product.description.substring(0, 90)}…`
                : product.description}
            </p>
          )}

          {product.rating && (
            <div className="pc-rating">
              <span className="pc-stars">{renderStars(product.rating)}</span>
              <span className="pc-rating-count">({product.reviewCount || 0})</span>
            </div>
          )}

          <div className="pc-footer">
            <div className="pc-price">
              {(() => {
                const priceCurrent = product?.effectivePrice ?? product?.price?.sale ?? product?.price?.base ?? product?.price ?? 0;
                const hasDiscount = (product?.discountPercentage ?? 0) > 0;
                const basePrice = product?.price?.base ?? product?.price ?? priceCurrent;
                return hasDiscount ? (
                  <>
                    <span className="pc-price-old">{formatPrice(basePrice)}</span>
                    <span className="pc-price-current sale">{formatPrice(priceCurrent)}</span>
                  </>
                ) : (
                  <span className="pc-price-current">{formatPrice(priceCurrent)}</span>
                );
              })()}
            </div>

            <div className={`pc-stock-badge ${stockCount > 0 ? 'in' : 'out'}`}>
              <span className="pc-stock-dot" />
              {stockCount > 0 ? `${stockCount} dispo` : 'Rupture'}
            </div>
          </div>

          {product.customizable && (
            <div className="pc-custom-badge">🎨 Personnalisable</div>
          )}
        </div>
    
      </Link>

      {/* Bouton "Ajouter au panier" supprimé selon la demande */}
       {/* <div className="p-4 border-t">
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
      </div> */}
    </motion.div>
  );
};

export default ProductCard;
