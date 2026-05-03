import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import { updateQuantity, removeFromCart, clearCart } from '../store/slices/cartSlice';
import CustomizationPreview from '../components/CustomizationPreview'; // ← adapter selon votre arborescence
import './Cart.css';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, itemCount } = useSelector(state => state.cart);

  const modelTotal = items.reduce((sum, item) => {
    const qty  = Number(item.quantity || 1);
    const base = typeof item?.customization?.totals?.baseModelPrice === 'number'
      ? item.customization.totals.baseModelPrice
      : Number(item.price || 0);
    return sum + base * qty;
  }, 0);

  const customizationTotal = items.reduce((sum, item) => {
    const qty    = Number(item.quantity || 1);
    const custom = typeof item?.customization?.totals?.customizationPrice === 'number'
      ? item.customization.totals.customizationPrice
      : 0;
    return sum + custom * qty;
  }, 0);

  const getItemTotal = (item) => {
    const qty = Number(item.quantity || 1);
    if (item?.customization?.totals?.grandTotal !== undefined)
      return Number(item.customization.totals.grandTotal) * qty;
    if (item?.customization?.totals)
      return (Number(item.customization.totals.baseModelPrice || 0) +
              Number(item.customization.totals.customizationPrice || 0)) * qty;
    return Number(item.price || 0) * qty;
  };

  const handleQuantityChange = (itemId, newQty) => {
    if (newQty <= 0) dispatch(removeFromCart(itemId));
    else dispatch(updateQuantity({ id: itemId, quantity: newQty }));
  };

  const hasCustom = (item) =>
    (item?.customization?.textLayers?.length > 0) ||
    Boolean(item?.customization?.image?.url);

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-icon"><FiShoppingBag /></div>
        <h2>Votre panier est vide</h2>
        <p>Découvrez nos produits et ajoutez-les à votre panier</p>
        <button onClick={() => navigate('/products')} className="shop-now-btn">
          Commencer mes achats
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Mon Panier</h1>
        <p>{itemCount} article{itemCount > 1 ? 's' : ''}</p>
      </div>

      <div className="cart-content">

        {/* ── Items ── */}
        <div className="cart-items">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="cart-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              {/* Image ou aperçu de personnalisation */}
              <div className="item-image">
                {hasCustom(item) ? (
                  <CustomizationPreview item={item} size="sm" showSide="front" />
                ) : (
                  <img
                    src={item.image || '/placeholder-product.jpg'}
                    alt={item.name}
                  />
                )}
              </div>

              {/* Details */}
              <div className="item-details">
                <h3>{item.name}</h3>
                {(item.size || item.color) && (
                  <p className="item-variant">
                    {item.size && `Taille: ${item.size}`}
                    {item.size && item.color && ' · '}
                    {item.color && `Couleur: ${item.color}`}
                  </p>
                )}
                {/* Badge personnalisé */}
                {hasCustom(item) && (
                  <span className="item-custom-badge">🎨 Personnalisé</span>
                )}
              </div>

              {/* Remove */}
              <button
                className="remove-btn"
                onClick={() => dispatch(removeFromCart(item.id))}
                aria-label="Supprimer l'article"
              >
                <FiTrash2 />
              </button>

              {/* Controls */}
              <div className="item-controls">
                <div className="item-quantity">
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    aria-label="Diminuer"
                  >
                    <FiMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    aria-label="Augmenter"
                  >
                    <FiPlus />
                  </button>
                </div>

                <div className="item-price">
                  <span className="total-price">{getItemTotal(item).toFixed(2)} €</span>
                </div>
              </div>

              {/* ── Aperçu complet de la personnalisation ── */}
              {hasCustom(item) && (
                <div className="item-customization-preview">
                  <CustomizationPreview item={item} size="md" showSide="both" />
                </div>
              )}

            </motion.div>
          ))}

          <div className="cart-actions">
            <button className="clear-cart-btn" onClick={() => dispatch(clearCart())}>
              Vider le panier
            </button>
          </div>
        </div>

        {/* ── Summary ── */}
        <div className="cart-summary">
          <h2>Résumé de la commande</h2>

          <div className="summary-line">
            <span>Sous-total articles</span>
            <span>{modelTotal.toFixed(2)} €</span>
          </div>

          {customizationTotal > 0 && (
            <div className="summary-line">
              <span>Personnalisation</span>
              <span>{customizationTotal.toFixed(2)} €</span>
            </div>
          )}

          <div className="summary-line">
            <span>Livraison</span>
            <span>Calculée à l'étape suivante</span>
          </div>

          <div className="summary-line total">
            <span>Total</span>
            <span>{(modelTotal + customizationTotal).toFixed(2)} €</span>
          </div>

          <button className="checkout-btn" onClick={() => navigate('/checkout')}>
            Procéder au paiement
          </button>

          <button className="continue-shopping-btn" onClick={() => navigate('/products')}>
            Continuer mes achats
          </button>
        </div>

      </div>
    </div>
  );
};

export default Cart;