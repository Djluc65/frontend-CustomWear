import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiUser, FiArrowLeft, FiLoader } from 'react-icons/fi';
import api from '../services/api';
import './Checkoutresult.css';

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId   = searchParams.get('session_id');
  const paypalToken = searchParams.get('token');

  const [paypalCapture, setPaypalCapture] = useState(null);
  const [captureError, setCaptureError]   = useState(null);
  const [capturing, setCapturing]         = useState(false);

  useEffect(() => {
    if (!paypalToken) return;
    const capturePaypal = async () => {
      setCapturing(true);
      try {
        const { data } = await api.post(`/api/paypal/capture-order/${paypalToken}`);
        setPaypalCapture(data?.data || data);
      } catch (err) {
        setCaptureError('Erreur lors de la confirmation PayPal');
        console.error('[CheckoutSuccess] Capture PayPal error:', err);
      } finally {
        setCapturing(false);
      }
    };
    capturePaypal();
  }, [paypalToken]);

  const paypalStatus = captureError
    ? 'Erreur de confirmation'
    : capturing
      ? 'Confirmation en cours…'
      : (paypalCapture?.status || '—');

  return (
    <div className="result-page">
      <div className="result-card">

        {/* Icon */}
        <div className="result-icon result-icon--success">
          <FiCheckCircle />
        </div>

        {/* Title */}
        <h1 className="result-title result-title--success">Paiement réussi !</h1>
        <p className="result-subtitle">
          Merci pour votre commande. Vous allez recevoir un email de confirmation sous peu.
        </p>

        {/* Session / order IDs */}
        {(sessionId || paypalToken) && (
          <div className="result-ref-block">
            {sessionId && (
              <div className="result-ref">
                <span className="result-ref-label">Référence Stripe</span>
                <code className="result-ref-value">{sessionId}</code>
              </div>
            )}
            {paypalToken && (
              <div className="result-ref">
                <span className="result-ref-label">Commande PayPal</span>
                <code className="result-ref-value">{paypalToken}</code>
              </div>
            )}
          </div>
        )}

        {/* Info block */}
        <div className="result-info-block">
          <div className="result-info-item">
            <div className="result-info-icon">📧</div>
            <div className="result-info-text">
              <strong>Email de confirmation</strong>
              <span>Un récapitulatif de votre commande vous sera envoyé par email.</span>
            </div>
          </div>

          <div className="result-info-item">
            <div className="result-info-icon">📦</div>
            <div className="result-info-text">
              <strong>Suivi de commande</strong>
              <span>Consultez l'état de vos livraisons depuis votre espace personnel.</span>
            </div>
          </div>

          {paypalToken && (
            <div className={`result-info-item ${captureError ? 'result-info-item--error' : ''}`}>
              <div className="result-info-icon">{capturing ? '⏳' : captureError ? '⚠️' : '✅'}</div>
              <div className="result-info-text">
                <strong>Statut PayPal</strong>
                <span className={captureError ? 'result-status--error' : 'result-status--ok'}>
                  {paypalStatus}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="result-actions">
          <Link to="/profile" className="result-btn result-btn--primary">
            <FiUser />
            Voir mes commandes
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

export default CheckoutSuccess;
