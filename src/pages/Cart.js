import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import { updateQuantity, removeFromCart, clearCart } from '../store/slices/cartSlice';
import './Cart.css';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, itemCount } = useSelector(state => state.cart);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart(itemId));
    } else {
      dispatch(updateQuantity({ id: itemId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <FiShoppingBag className="empty-icon" />
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
        <div className="cart-items">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="cart-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="item-image">
                <img src={item.image || '/placeholder-product.jpg'} alt={item.name} />
              </div>
              
              <div className="item-details">
                <h3>{item.name}</h3>
                <p className="item-variant">
                  {item.variant && (
                    <>
                      {item.variant.size && `Taille: ${item.variant.size}`}
                      {item.variant.color && ` - Couleur: ${item.variant.color}`}
                    </>
                  )}
                </p>
                {item.customization && (
                  <p className="item-customization">
                    Personnalisé: {item.customization.text}
                  </p>
                )}
              </div>
              
              <div className="item-quantity">
                <button 
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  className="quantity-btn"
                >
                  <FiMinus />
                </button>
                <span>{item.quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  className="quantity-btn"
                >
                  <FiPlus />
                </button>
              </div>
              
              <div className="item-price">
                <span className="unit-price">{item.price.toFixed(2)} €</span>
                <span className="total-price">{(item.price * item.quantity).toFixed(2)} €</span>
              </div>
              
              <button 
                onClick={() => handleRemoveItem(item.id)}
                className="remove-btn"
              >
                <FiTrash2 />
              </button>
            </motion.div>
          ))}
          
          <div className="cart-actions">
            <button onClick={handleClearCart} className="clear-cart-btn">
              Vider le panier
            </button>
          </div>
        </div>

        <div className="cart-summary">
          <h2>Résumé de la commande</h2>
          
          <div className="summary-line">
            <span>Sous-total</span>
            <span>{total.toFixed(2)} €</span>
          </div>
          
          <div className="summary-line">
            <span>Livraison</span>
            <span>Calculée à l'étape suivante</span>
          </div>
          
          <div className="summary-line total">
            <span>Total</span>
            <span>{total.toFixed(2)} €</span>
          </div>
          
          <button onClick={handleCheckout} className="checkout-btn">
            Procéder au paiement
          </button>
          
          <button onClick={() => navigate('/products')} className="continue-shopping-btn">
            Continuer mes achats
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;