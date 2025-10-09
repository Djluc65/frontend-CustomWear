import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCreditCard, FiTruck, FiUser } from 'react-icons/fi';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total } = useSelector(state => state.cart);
  const { user } = useSelector(state => state.auth);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    shipping: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'France'
    },
    payment: {
      method: 'card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardName: ''
    }
  });

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Logique de traitement de la commande
    console.log('Order submitted:', formData);
    // Redirection vers page de confirmation
    navigate('/order-confirmation');
  };

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Votre panier est vide</h2>
        <button onClick={() => navigate('/products')}>
          Retourner aux produits
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Finaliser ma commande</h1>
        <div className="checkout-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <FiTruck />
            <span>Livraison</span>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <FiCreditCard />
            <span>Paiement</span>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <FiUser />
            <span>Confirmation</span>
          </div>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-form">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <motion.div
                className="form-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2>Informations de livraison</h2>
                <div className="form-grid">
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={formData.shipping.firstName}
                    onChange={(e) => handleInputChange('shipping', 'firstName', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Nom"
                    value={formData.shipping.lastName}
                    onChange={(e) => handleInputChange('shipping', 'lastName', e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.shipping.email}
                    onChange={(e) => handleInputChange('shipping', 'email', e.target.value)}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={formData.shipping.phone}
                    onChange={(e) => handleInputChange('shipping', 'phone', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Adresse"
                    className="full-width"
                    value={formData.shipping.address}
                    onChange={(e) => handleInputChange('shipping', 'address', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Ville"
                    value={formData.shipping.city}
                    onChange={(e) => handleInputChange('shipping', 'city', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Code postal"
                    value={formData.shipping.postalCode}
                    onChange={(e) => handleInputChange('shipping', 'postalCode', e.target.value)}
                    required
                  />
                </div>
                <button type="button" onClick={() => setStep(2)} className="next-btn">
                  Continuer vers le paiement
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                className="form-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2>Informations de paiement</h2>
                <div className="payment-methods">
                  <label className="payment-method">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.payment.method === 'card'}
                      onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                    />
                    <span>Carte bancaire</span>
                  </label>
                  <label className="payment-method">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.payment.method === 'paypal'}
                      onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                    />
                    <span>PayPal</span>
                  </label>
                </div>

                {formData.payment.method === 'card' && (
                  <div className="card-form">
                    <input
                      type="text"
                      placeholder="Nom sur la carte"
                      value={formData.payment.cardName}
                      onChange={(e) => handleInputChange('payment', 'cardName', e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Numéro de carte"
                      value={formData.payment.cardNumber}
                      onChange={(e) => handleInputChange('payment', 'cardNumber', e.target.value)}
                      required
                    />
                    <div className="card-details">
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={formData.payment.expiryDate}
                        onChange={(e) => handleInputChange('payment', 'expiryDate', e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        value={formData.payment.cvv}
                        onChange={(e) => handleInputChange('payment', 'cvv', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" onClick={() => setStep(1)} className="back-btn">
                    Retour
                  </button>
                  <button type="submit" className="submit-btn">
                    Finaliser la commande
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </div>

        <div className="order-summary">
          <h2>Résumé de commande</h2>
          <div className="order-items">
            {items.map(item => (
              <div key={item.id} className="order-item">
                <img src={item.image || '/placeholder-product.jpg'} alt={item.name} />
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>Quantité: {item.quantity}</p>
                </div>
                <span className="item-total">{(item.price * item.quantity).toFixed(2)} €</span>
              </div>
            ))}
          </div>
          
          <div className="order-totals">
            <div className="total-line">
              <span>Sous-total</span>
              <span>{total.toFixed(2)} €</span>
            </div>
            <div className="total-line">
              <span>Livraison</span>
              <span>5.99 €</span>
            </div>
            <div className="total-line final">
              <span>Total</span>
              <span>{(total + 5.99).toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;