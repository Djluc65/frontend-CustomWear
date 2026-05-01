import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiXCircle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import './Checkoutresult.css';

const DesignCancel = () => {
  const [searchParams] = useSearchParams();
  const designRequestId = searchParams.get('designRequestId') || localStorage.getItem('customwear:lastDesignRequestId');

  return (
    <div className="result-page">
      <div className="result-card">
        <div className="result-icon result-icon--cancel">
          <FiXCircle />
        </div>

        <h1 className="result-title result-title--cancel">Paiement annulé</h1>
        <p className="result-subtitle">
          Ton paiement n’a pas été finalisé. Tu peux réessayer quand tu veux.
        </p>

        {designRequestId && (
          <div className="result-ref-block">
            <div className="result-ref">
              <span className="result-ref-label">Demande design</span>
              <code className="result-ref-value">{designRequestId}</code>
            </div>
          </div>
        )}

        <div className="result-info-block">
          <div className="result-info-item">
            <div className="result-info-icon">🧾</div>
            <div className="result-info-text">
              <strong>Rien n’est facturé</strong>
              <span>Le service démarre uniquement après paiement confirmé.</span>
            </div>
          </div>
          <div className="result-info-item">
            <div className="result-info-icon">🛠️</div>
            <div className="result-info-text">
              <strong>Tu peux ajuster ton brief</strong>
              <span>Style, couleurs, pack, options… refais un essai.</span>
            </div>
          </div>
        </div>

        <div className="result-actions">
          <Link to="/design" className="result-btn result-btn--primary">
            <FiRefreshCw />
            Réessayer
          </Link>
          <Link to="/products" className="result-btn result-btn--secondary">
            <FiArrowLeft />
            Continuer sur la boutique
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DesignCancel;

