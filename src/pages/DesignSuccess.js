import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiArrowRight, FiLoader, FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';
import './Checkoutresult.css';

const DesignSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const designRequestId = searchParams.get('designRequestId') || localStorage.getItem('customwear:lastDesignRequestId');
  const sessionId = searchParams.get('session_id');
  const paypalOrderId = searchParams.get('token');

  const [status, setStatus] = useState('confirmation');
  const [error, setError] = useState(null);
  const [redirectIn, setRedirectIn] = useState(4);

  const canContinue = useMemo(() => Boolean(designRequestId), [designRequestId]);

  useEffect(() => {
    if (!canContinue) {
      setStatus('error');
      setError('Demande introuvable. Recrée une demande de design.');
    }
  }, [canContinue]);

  useEffect(() => {
    if (!canContinue) return;

    const confirm = async () => {
      try {
        setStatus('confirmation');

        if (paypalOrderId) {
          const capture = await api.post(`/api/paypal/capture-order/${paypalOrderId}`);
          const captureStatus = capture?.data?.data?.status || capture?.data?.status;
          if (!captureStatus) throw new Error('Confirmation PayPal impossible.');

          await api.post(`/api/design-requests/${designRequestId}/confirm-payment`, {
            method: 'paypal',
            paypalOrderId
          });

          setStatus('ok');
          return;
        }

        if (!sessionId) throw new Error('Référence Stripe manquante.');

        const { data: stripeSession } = await api.get(`/api/payments/checkout-session/${sessionId}`);
        const paymentStatus = stripeSession?.data?.paymentStatus;

        if (paymentStatus !== 'paid') {
          throw new Error('Paiement non confirmé. Si tu viens de payer, réessaie dans quelques secondes.');
        }

        await api.post(`/api/design-requests/${designRequestId}/confirm-payment`, {
          method: 'card',
          stripeSessionId: sessionId
        });

        setStatus('ok');
      } catch (err) {
        setStatus('error');
        setError(err?.response?.data?.message || err?.message || 'Erreur lors de la confirmation.');
      }
    };

    confirm();
  }, [canContinue, designRequestId, paypalOrderId, sessionId]);

  useEffect(() => {
    if (status !== 'ok') return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setRedirectIn((s) => {
        const next = s - 1;
        if (next <= 0) {
          navigate(`/customize?designRequestId=${encodeURIComponent(designRequestId)}`);
          return 0;
        }
        return next;
      });
    };
    const id = window.setInterval(tick, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [designRequestId, navigate, status]);

  return (
    <div className="result-page">
      <div className="result-card">
        <div className="result-icon result-icon--success">
          <FiCheckCircle />
        </div>

        <h1 className="result-title result-title--success">Paiement confirmé</h1>

        {status === 'confirmation' && (
          <p className="result-subtitle">
            <FiLoader style={{ marginRight: 8 }} />
            Confirmation en cours…
          </p>
        )}

        {status === 'ok' && (
          <p className="result-subtitle">
            Ta demande est lancée. Redirection vers la personnalisation dans {redirectIn}s.
          </p>
        )}

        {status === 'error' && (
          <p className="result-subtitle" style={{ color: '#dc2626' }}>
            {error || 'Erreur de confirmation'}
          </p>
        )}

        {designRequestId && (
          <div className="result-ref-block">
            <div className="result-ref">
              <span className="result-ref-label">Demande design</span>
              <code className="result-ref-value">{designRequestId}</code>
            </div>
            {sessionId && (
              <div className="result-ref">
                <span className="result-ref-label">Référence Stripe</span>
                <code className="result-ref-value">{sessionId}</code>
              </div>
            )}
            {paypalOrderId && (
              <div className="result-ref">
                <span className="result-ref-label">Commande PayPal</span>
                <code className="result-ref-value">{paypalOrderId}</code>
              </div>
            )}
          </div>
        )}

        <div className="result-info-block">
          <div className="result-info-item">
            <div className="result-info-icon">🎨</div>
            <div className="result-info-text">
              <strong>Création en cours</strong>
              <span>Première proposition sous 48–72h (ou express si option).</span>
            </div>
          </div>
          <div className="result-info-item">
            <div className="result-info-icon">🧵</div>
            <div className="result-info-text">
              <strong>Étape suivante</strong>
              <span>Choisis un produit et prépare ton futur rendu.</span>
            </div>
          </div>
        </div>

        <div className="result-actions">
          <Link
            to={designRequestId ? `/customize?designRequestId=${encodeURIComponent(designRequestId)}` : '/customize'}
            className="result-btn result-btn--primary"
          >
            <FiArrowRight />
            Appliquer mon design
          </Link>
          <Link to="/design/messages" className="result-btn result-btn--secondary">
            Discuter
          </Link>
          <Link to="/design" className="result-btn result-btn--secondary">
            <FiArrowLeft />
            Revenir au formulaire
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DesignSuccess;
