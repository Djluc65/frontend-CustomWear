import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Veuillez entrer votre email');
      return;
    }
    try {
      setLoading(true);
      const { data } = await authAPI.forgotPassword(email);
      toast.success(data?.message || 'Si cet email existe, un lien a été envoyé');
      if (data?.resetUrl) setDevResetUrl(data.resetUrl);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la demande';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Mot de passe oublié</h2>
      <p>Saisissez votre email pour recevoir un lien de réinitialisation.</p>
      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
            style={{ width: '100%', padding: 10 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Envoi…' : 'Envoyer le lien'}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate('/auth?mode=login')} style={{ width: '100%', padding: 10 }}>
          Retour à la connexion
        </button>
      </div>

      {devResetUrl && (
        <div style={{ marginTop: 16, background: '#f9fafb', padding: 12, borderRadius: 6 }}>
          <strong>Dev:</strong> lien de test
          <div>
            <a href={devResetUrl}>Ouvrir la page de réinitialisation</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;