import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCreditCard, FiTruck, FiUser } from 'react-icons/fi';
import api from '../services/api';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, total } = useSelector(state => state.cart);
  const { user } = useSelector(state => state.auth);

  // Calcul des totaux détaillés (Modèles vs Personnalisation)
  const cartModelTotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity || 1);
    const baseModelUnit = (typeof item?.customization?.totals?.baseModelPrice === 'number')
      ? Number(item.customization.totals.baseModelPrice)
      : Number(item.price || 0);
    return sum + baseModelUnit * quantity;
  }, 0);

  const cartCustomizationTotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity || 1);
    const customizationUnit = (typeof item?.customization?.totals?.customizationPrice === 'number')
      ? Number(item.customization.totals.customizationPrice)
      : 0;
    return sum + customizationUnit * quantity;
  }, 0);
  
  const [step, setStep] = useState(1);
  const [isPaying, setIsPaying] = useState(false);
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
    if (step !== 2) {
      // Forcer le passage à l’étape paiement si on n’y est pas
      return setStep(2);
    }

    try {
      setIsPaying(true);
      // Préparer les items (montants en centimes)
      const lineItems = items.map((item) => ({
        name: item.name,
        amount: Math.round(Number(item.price) * 100),
        quantity: Number(item.quantity) || 1,
        currency: 'EUR',
        image: item.image || undefined,
        sku: item.sku || undefined
      }));

      // Frais de livraison affichés dans le résumé (5.99 €)
      const shippingFeeCents = 599;

      if (formData.payment.method === 'card') {
        // Stripe Checkout
        const { data } = await api.post('/api/payments/create-checkout-session', {
          items: lineItems,
          customerEmail: formData?.shipping?.email || user?.email || undefined,
          shippingFeeCents,
          metadata: {
            source: 'checkout-page',
            cartItemsCount: items.length
          }
        });

        if (data?.url) {
          window.location.assign(data.url);
        } else {
          console.error('URL de session Stripe manquante');
        }
      } else if (formData.payment.method === 'paypal') {
        // PayPal Checkout: créer l'ordre puis rediriger vers l'approve URL
        const { data } = await api.post('/api/paypal/create-order', {
          items: lineItems,
          customerEmail: formData?.shipping?.email || user?.email || undefined,
          shippingFeeCents,
          metadata: {
            source: 'checkout-page',
            cartItemsCount: items.length
          }
        });

        if (data?.approveUrl) {
          window.location.assign(data.approveUrl);
        } else {
          console.error('Lien d’approbation PayPal manquant');
        }
      }
    } catch (err) {
      console.error('Erreur lors de l’initiation du paiement:', err);
    } finally {
      setIsPaying(false);
    }
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
                  <label className={`payment-method ${formData.payment.method === 'card' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.payment.method === 'card'}
                      onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                    />
                    <span>Carte bancaire</span>
                  </label>
                  <label className={`payment-method ${formData.payment.method === 'paypal' ? 'selected' : ''}`}>
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

                {formData.payment.method === 'paypal' && (
                  <div className="paypal-info">
                    Vous serez redirigé vers PayPal pour valider votre paiement.
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" onClick={() => setStep(1)} className="back-btn">
                    Retour
                  </button>
                  {formData.payment.method === 'paypal' ? (
                    <button type="submit" className="paypal-btn" disabled={isPaying}>
                      {isPaying ? 'Redirection vers PayPal…' : 'Payer avec PayPal'}
                    </button>
                  ) : (
                    <button type="submit" className="submit-btn" disabled={isPaying}>
                      {isPaying ? 'Redirection vers Stripe…' : 'Payer par carte'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </form>
        </div>

        <div className="order-summary">
          <h2>Résumé de commande</h2>
          <div className="order-items">
            {items.map(item => {
              // Calcul du prix total pour cet article (Modèle + Personnalisation)
              const quantity = Number(item.quantity || 1);
              let itemTotalPrice = Number(item.price || 0) * quantity;
              
              if (item.customization?.totals) {
                 const base = Number(item.customization.totals.baseModelPrice || 0);
                 const cust = Number(item.customization.totals.customizationPrice || 0);
                 itemTotalPrice = (base + cust) * quantity;
              }

              return (
                <div key={item.id} className="order-item">
                  <img src={item.image || '/placeholder-product.jpg'} alt={item.name} />
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>Quantité: {item.quantity}</p>
                    {item.customization?.totals && (
                      <div className="item-price-details">
                        <p className="price-detail">
                          <span className="label">Modèle:</span>
                          <span className="value">{Number(item.customization.totals.baseModelPrice).toFixed(2)} €</span>
                        </p>
                        <p className="price-detail">
                          <span className="label">Personnalisation:</span>
                          <span className="value">{Number(item.customization.totals.customizationPrice).toFixed(2)} €</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <span className="item-total">{itemTotalPrice.toFixed(2)} €</span>
                </div>
              );
            })}
          </div>
          
          <div className="order-totals">
            {cartCustomizationTotal > 0 ? (
              <>
                <div className="total-line subtotal">
                  <span>Sous-total</span>
                  <span>{(cartModelTotal + cartCustomizationTotal).toFixed(2)} €</span>
                </div>
              </>
            ) : (
              <div className="total-line">
                <span>Sous-total</span>
                <span>{(cartModelTotal + cartCustomizationTotal).toFixed(2)} €</span>
              </div>
            )}
            <div className="total-line">
              <span>Livraison</span>
              <span>5.99 €</span>
            </div>
            <div className="total-line final">
              <span>Total</span>
              <span>{(cartModelTotal + cartCustomizationTotal + 5.99).toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
