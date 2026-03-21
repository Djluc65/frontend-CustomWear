import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiArrowLeft, FiKey } from 'react-icons/fi';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token,           setToken]           = useState(initialToken);
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);

  useEffect(() => {
    if (initialToken) setToken(initialToken);
  }, [initialToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Token manquant'); return;
    }
    if (!password || password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères'); return;
    }
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas'); return;
    }

    try {
      setLoading(true);
      const { data } = await authAPI.resetPassword(token, password);
      toast.success(data?.message || 'Mot de passe réinitialisé');
      navigate('/auth?mode=login');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la réinitialisation';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">

        {/* ── Header ── */}
        <div className="reset-header">
          <div className="reset-icon">
            <FiLock />
          </div>
          <h1 className="reset-title">Réinitialiser le mot de passe</h1>
          <p className="reset-subtitle">
            Choisissez un nouveau mot de passe sécurisé pour votre compte.
          </p>
        </div>

        {/* ── Form ── */}
        <form className="reset-form" onSubmit={handleSubmit}>

          {/* Token */}
          <div className="reset-form-group">
            <label htmlFor="token" className="reset-label">
              Token de réinitialisation
            </label>
            <input
              id="token"
              type="text"
              className="reset-input"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Collez ici le token reçu par email"
              required
            />
            {!initialToken && (
              <span className="reset-token-hint">
                Le token est envoyé par email lors d'une demande de réinitialisation.
              </span>
            )}
          </div>

          {/* New password */}
          <div className="reset-form-group">
            <label htmlFor="password" className="reset-label">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              className="reset-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              required
            />
          </div>

          {/* Confirm password */}
          <div className="reset-form-group">
            <label htmlFor="confirmPassword" className="reset-label">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="reset-input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Répétez le mot de passe"
              required
            />
          </div>

          {/* Submit */}
          <button type="submit" className="reset-btn-primary" disabled={loading}>
            {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
          </button>
        </form>

        {/* ── Back ── */}
        <button
          type="button"
          className="reset-btn-back"
          onClick={() => navigate('/auth?mode=login')}
        >
          <FiArrowLeft />
          Retour à la connexion
        </button>

      </div>
    </div>
  );
};

export default ResetPassword;