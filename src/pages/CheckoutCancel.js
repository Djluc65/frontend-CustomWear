import React from 'react';
import { Link } from 'react-router-dom';
import { FiXCircle, FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import './CheckoutResult.css';

const CheckoutCancel = () => {
  return (
    <div className="result-page">
      <div className="result-card">

        {/* Icon */}
        <div className="result-icon result-icon--cancel">
          <FiXCircle />
        </div>

        {/* Title */}
        <h1 className="result-title result-title--cancel">Paiement annulé</h1>
        <p className="result-subtitle">
          Votre paiement n'a pas été finalisé. Vous pouvez ajuster votre panier ou réessayer.
        </p>

        {/* Info block */}
        <div className="result-info-block">
          <div className="result-info-item">
            <div className="result-info-icon">🛒</div>
            <div className="result-info-text">
              <strong>Votre panier est intact</strong>
              <span>Vérifiez les quantités et variantes avant de payer.</span>
            </div>
          </div>
          <div className="result-info-item">
            <div className="result-info-icon">💬</div>
            <div className="result-info-text">
              <strong>Besoin d'aide ?</strong>
              <span>Notre support est disponible pour vous accompagner.</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="result-actions">
          <Link to="/cart" className="result-btn result-btn--primary">
            <FiShoppingCart />
            Retour au panier
          </Link>
          <Link to="/products" className="result-btn result-btn--secondary">
            <FiArrowLeft />
            Continuer mes achats
          </Link>
        </div>

      </div>
    </div>
  );
};

export default CheckoutCancel;