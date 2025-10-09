import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const paypalToken = searchParams.get('token'); // PayPal renvoie l'orderId sous 'token'

  const [paypalCapture, setPaypalCapture] = useState(null);
  const [captureError, setCaptureError] = useState(null);

  useEffect(() => {
    const capturePaypal = async () => {
      if (!paypalToken) return;
      try {
        const { data } = await api.post(`/api/paypal/capture-order/${paypalToken}`);
        setPaypalCapture(data?.data || data);
      } catch (err) {
        setCaptureError('Erreur lors de la confirmation PayPal');
        console.error('[CheckoutSuccess] Capture PayPal error:', err);
      }
    };
    capturePaypal();
  }, [paypalToken]);

  return (
    <div className="checkout-page">
      <div className="checkout-header" style={{ textAlign: 'center' }}>
        <h1>Paiement réussi ✅</h1>
        <p>Merci pour votre commande !</p>
        {sessionId && (
          <p style={{ color: '#6b7280' }}>Stripe session_id: {sessionId}</p>
        )}
        {paypalToken && (
          <p style={{ color: '#6b7280' }}>PayPal order: {paypalToken}</p>
        )}
     </div>

      <div className="checkout-content" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="order-summary" style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2>Prochaines étapes</h2>
          <div className="order-items">
            <div className="order-item">
              <div className="item-info">
                <h4>Confirmation</h4>
                <p>Vous recevrez un email de confirmation sous peu.</p>
              </div>
            </div>
            <div className="order-item">
              <div className="item-info">
                <h4>Suivi de commande</h4>
                <p>Consultez l’état de vos commandes dans votre profil.</p>
              </div>
            </div>
          </div>

          <div className="order-totals">
            {paypalToken && (
              <div className="total-line">
                <span>Statut PayPal</span>
                <span>{captureError ? 'Erreur' : (paypalCapture?.status || 'Confirmation en cours...')}</span>
              </div>
            )}
            <div className="total-line">
              <span>Besoin d’aide ?</span>
              <span>Contactez le support</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Link to="/profile" className="submit-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Voir mes commandes</Link>
            <Link to="/products" className="back-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Continuer mes achats</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;