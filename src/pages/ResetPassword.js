import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialToken) setToken(initialToken);
  }, [initialToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Token manquant');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
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
    <div className="container" style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Réinitialiser le mot de passe</h2>
      <p>Choisissez un nouveau mot de passe pour votre compte.</p>
      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label htmlFor="token">Token de réinitialisation</label>
          <input
            id="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Collez ici le token"
            required
            style={{ width: '100%', padding: 10 }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label htmlFor="password">Nouveau mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre nouveau mot de passe"
            required
            style={{ width: '100%', padding: 10 }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmez le mot de passe"
            required
            style={{ width: '100%', padding: 10 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate('/auth?mode=login')} style={{ width: '100%', padding: 10 }}>
          Retour à la connexion
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;