import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiShield
} from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import { loginUser, registerUser, facebookLogin, googleLogin } from '../store/slices/authSlice';
import { FaFacebook } from 'react-icons/fa';
import { createTestAdmin } from '../utils/testAuth';
import './Auth.css';

const Auth = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error } = useSelector(state => state.auth);
  const ENABLE_TEST_ADMIN = import.meta.env.VITE_ENABLE_TEST_ADMIN === 'true';

  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin]           = useState(searchParams.get('mode') !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData]         = useState({
    email: '', password: '', firstName: '', lastName: '', confirmPassword: ''
  });

  const handleInputChange = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas'); return;
    }
    if (!isLogin) {
      const namePattern = /^[a-zA-ZÀ-ÿ\s\-']+$/;
      if (!formData.firstName || formData.firstName.trim().length < 2 ||
          formData.firstName.trim().length > 50 || !namePattern.test(formData.firstName.trim())) {
        alert('Prénom invalide: 2-50 caractères, lettres/espaces/tirets/apostrophes'); return;
      }
      if (!formData.lastName || formData.lastName.trim().length < 2 ||
          formData.lastName.trim().length > 50 || !namePattern.test(formData.lastName.trim())) {
        alert('Nom invalide: 2-50 caractères, lettres/espaces/tirets/apostrophes'); return;
      }
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,128}$/;
      if (!passwordPattern.test(formData.password)) {
        alert('Mot de passe invalide: 6-128 caractères, avec minuscule, majuscule et chiffre'); return;
      }
    }

    try {
      if (isLogin) {
        await dispatch(loginUser({ email: formData.email, password: formData.password })).unwrap();
      } else {
        await dispatch(registerUser({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
        })).unwrap();
      }
      navigate('/');
    } catch (err) {
      const message = typeof err === 'string' ? err : (err?.message || "Erreur d'authentification");
      alert(message);
    }
  };

  /* ── Social ── */
  const handleGoogleSuccess = async ({ credential }) => {
    if (!credential) return;
    try { await dispatch(googleLogin(credential)).unwrap(); navigate('/'); }
    catch (err) { alert(typeof err === 'string' ? err : (err?.message || 'Erreur Google')); }
  };

  const handleGoogleError = () => alert('Échec de la connexion Google');

  const handleFacebookSuccess = async (response) => {
    if (!response?.accessToken) return;
    try { await dispatch(facebookLogin(response.accessToken)).unwrap(); navigate('/'); }
    catch (err) { alert(typeof err === 'string' ? err : (err?.message || 'Erreur Facebook')); }
  };

  const handleFacebookFail = (err) => {
    if (err?.status === 'unknown') return;
    alert('Échec de la connexion Facebook');
  };

  const handleTestAdminLogin = () => {
    const { user, token } = createTestAdmin();
    dispatch({ type: 'auth/loginSuccess', payload: { user, token } });
    navigate('/admin');
  };

  /* ── Render ── */
  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* ── LEFT : FORM ── */}
        <motion.div
          className="auth-form"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Toggle connexion / inscription */}
          <div className="auth-toggle">
            <button
              type="button"
              className={`auth-toggle-btn ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Connexion
            </button>
            <button
              type="button"
              className={`auth-toggle-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Inscription
            </button>
          </div>

          {/* Titre */}
          <div className="auth-header">
            <h1>{isLogin ? 'Bon retour !' : 'Créer un compte'}</h1>
            <p>
              {isLogin
                ? 'Connectez-vous pour accéder à vos designs'
                : 'Rejoignez la communauté CustomWear'}
            </p>
          </div>

          {/* Erreur */}
          {error && <div className="error-message">{error}</div>}

          {/* Formulaire */}
          <form className="form" onSubmit={handleSubmit}>

            {!isLogin && (
              <div className="form-row">
                <div className="form-group">
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={formData.firstName}
                      onChange={e => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      type="text"
                      placeholder="Nom"
                      value={formData.lastName}
                      onChange={e => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirmer le mot de passe"
                    value={formData.confirmPassword}
                    onChange={e => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Chargement…' : (isLogin ? 'Se connecter' : "S'inscrire")}
            </button>
          </form>

          {/* Séparateur */}
          <div className="divider">
            <span>ou</span>
          </div>

          {/* Connexions sociales */}
          <div className="social-buttons">
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                width="350"
                text="continue_with"
                locale="fr"
              />
            </div>

            <FacebookLogin
              appId={import.meta.env.VITE_FACEBOOK_APP_ID || '123456789012345'}
              onSuccess={handleFacebookSuccess}
              onFail={handleFacebookFail}
              onProfileSuccess={res => console.log('FB Profile:', res)}
              render={({ onClick }) => (
                <button type="button" className="facebook-btn" onClick={onClick}>
                  <FaFacebook className="facebook-icon" />
                  <span>Continuer avec Facebook</span>
                </button>
              )}
            />

            {ENABLE_TEST_ADMIN && isLogin && (
              <button type="button" className="test-admin-btn" onClick={handleTestAdminLogin}>
                <FiShield />
                <span>Connexion Admin Test</span>
              </button>
            )}
          </div>

          {/* Bas de formulaire */}
          <div className="auth-switch">
            {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            <button type="button" className="switch-btn" onClick={() => setIsLogin(v => !v)}>
              {isLogin ? "S'inscrire" : 'Se connecter'}
            </button>
          </div>

          {isLogin && (
            <div className="forgot-password">
              <Link to="/forgot-password">Mot de passe oublié ?</Link>
            </div>
          )}
        </motion.div>

        {/* ── RIGHT : DECORATIVE PANEL ── */}
        <motion.div
          className="auth-image"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img src="/auth-illustration.svg" alt="CustomWear illustration" />
          <h2>Personnalisez vos vêtements</h2>
          <p>
            Créez des designs uniques et exprimez votre style personnel avec notre
            outil de personnalisation avancé.
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default Auth;