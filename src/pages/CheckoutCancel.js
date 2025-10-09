import React from 'react';
import { Link } from 'react-router-dom';

const CheckoutCancel = () => {
  return (
    <div className="checkout-page">
      <div className="checkout-header" style={{ textAlign: 'center' }}>
        <h1>Paiement annulé ❌</h1>
        <p>Vous pouvez ajuster votre panier ou réessayer.</p>
      </div>

      <div className="checkout-content" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="order-summary" style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2>Options</h2>
          <div className="order-items">
            <div className="order-item">
              <div className="item-info">
                <h4>Panier</h4>
                <p>Vérifiez les quantités et variantes avant de payer.</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link to="/cart" className="submit-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Retour au panier</Link>
            <Link to="/products" className="back-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Continuer mes achats</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancel;