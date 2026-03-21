import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiSend, FiExternalLink } from 'react-icons/fi';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email,       setEmail]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [devResetUrl, setDevResetUrl] = useState(null);
  const [sent,        setSent]        = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Veuillez entrer votre email'); return; }

    try {
      setLoading(true);
      const { data } = await authAPI.forgotPassword(email);
      toast.success(data?.message || 'Si cet email existe, un lien a été envoyé');
      setSent(true);
      if (data?.resetUrl) setDevResetUrl(data.resetUrl);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la demande';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">

        {/* ── Header ── */}
        <div className="forgot-header">
          <div className="forgot-icon">
            <FiMail />
          </div>
          <h1 className="forgot-title">Mot de passe oublié ?</h1>
          <p className="forgot-subtitle">
            Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {/* ── Success state ── */}
        {sent && !devResetUrl && (
          <div className="forgot-success-msg">
            <span className="forgot-success-icon">✅</span>
            <div>
              <strong>Email envoyé !</strong>
              <p>Vérifiez votre boîte de réception (et vos spams si nécessaire).</p>
            </div>
          </div>
        )}

        {/* ── Form ── */}
        {!sent && (
          <form className="forgot-form" onSubmit={handleSubmit}>
            <div className="forgot-form-group">
              <label htmlFor="email" className="forgot-label">
                Adresse email
              </label>
              <div className="forgot-input-wrapper">
                <FiMail className="forgot-input-icon" />
                <input
                  id="email"
                  type="email"
                  className="forgot-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              className="forgot-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="forgot-loading-inner">
                  <span className="forgot-spinner" />
                  Envoi en cours…
                </span>
              ) : (
                <>
                  <FiSend />
                  Envoyer le lien
                </>
              )}
            </button>
          </form>
        )}

        {/* ── Dev reset URL (dev mode only) ── */}
        {devResetUrl && (
          <div className="forgot-dev-block">
            <span className="forgot-dev-badge">DEV</span>
            <div className="forgot-dev-content">
              <strong>Lien de test généré</strong>
              <a
                href={devResetUrl}
                className="forgot-dev-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ouvrir la page de réinitialisation
                <FiExternalLink />
              </a>
            </div>
          </div>
        )}

        {/* ── Back button ── */}
        <button
          type="button"
          className="forgot-btn-back"
          onClick={() => navigate('/auth?mode=login')}
        >
          <FiArrowLeft />
          Retour à la connexion
        </button>

      </div>
    </div>
  );
};

export default ForgotPassword;