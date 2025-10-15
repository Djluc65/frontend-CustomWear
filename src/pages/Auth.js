import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiShield } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { loginUser, registerUser, facebookLogin, googleLogin } from '../store/slices/authSlice';
import { FaFacebook } from 'react-icons/fa';
import { createTestAdmin } from '../utils/testAuth';
import './Auth.css';

const Auth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.auth);
  const ENABLE_TEST_ADMIN = process.env.REACT_APP_ENABLE_TEST_ADMIN === 'true';
  
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(initialMode !== 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('[Auth] Soumission du formulaire', {
      isLogin,
      email: formData.email,
      firstName: !isLogin ? formData.firstName : undefined,
      lastName: !isLogin ? formData.lastName : undefined
    });
    
    // Validations côté client pour éviter erreurs backend
    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (!isLogin) {
      const namePattern = /^[a-zA-ZÀ-ÿ\s\-']+$/;
      if (!formData.firstName || formData.firstName.trim().length < 2 || formData.firstName.trim().length > 50 || !namePattern.test(formData.firstName.trim())) {
        alert('Prénom invalide: 2-50 caractères, lettres/espaces/tirets/apostrophes');
        return;
      }
      if (!formData.lastName || formData.lastName.trim().length < 2 || formData.lastName.trim().length > 50 || !namePattern.test(formData.lastName.trim())) {
        alert('Nom invalide: 2-50 caractères, lettres/espaces/tirets/apostrophes');
        return;
      }
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,128}$/;
      if (!passwordPattern.test(formData.password)) {
        alert('Mot de passe invalide: 6-128 caractères, avec minuscule, majuscule et chiffre');
        return;
      }
    }

    try {
      if (isLogin) {
        const result = await dispatch(loginUser({
          email: formData.email,
          password: formData.password
        })).unwrap();
        console.log('[Auth] Connexion réussie', { user: result?.user, hasToken: Boolean(result?.token) });
      } else {
        const result = await dispatch(registerUser({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName
        })).unwrap();
        console.log('[Auth] Inscription réussie', { user: result?.user, hasToken: Boolean(result?.token) });
      }
      navigate('/');
    } catch (error) {
      console.error('Auth error:', error);
      console.log('[Auth] Détails erreur', {
        message: error?.message,
        response: error?.response?.data,
        stack: error?.stack
      });
      const message = typeof error === 'string' ? error : (error?.message || 'Erreur d\'inscription');
      alert(message);
    }
  };

  useEffect(() => {
    // Charger et initialiser Google Identity Services si un Client ID est défini
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('[Auth] REACT_APP_GOOGLE_CLIENT_ID manquant');
      return;
    }

    const initializeGoogle = () => {
      try {
        if (!window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const credential = response?.credential;
              if (!credential) return;
              const result = await dispatch(googleLogin(credential)).unwrap();
              console.log('[Auth] Connexion Google réussie', { user: result?.user });
              navigate('/');
            } catch (error) {
              console.error('[Auth] Google login error', error);
              const message = typeof error === 'string' ? error : (error?.message || 'Erreur de connexion Google');
              alert(message);
            }
          }
        });
        const container = document.getElementById('google-btn-container');
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular'
          });
        }
      } catch (e) {
        console.warn('[Auth] Initialisation Google Identity échouée', e);
      }
    };

    // Si le SDK est déjà présent (chargé via index.html), initialiser directement
    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    // Sinon, injecter le script et initialiser au chargement
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);
    return () => {
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };
  }, [dispatch, navigate]);

  const handleGoogleAuth = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      alert('SDK Google non chargé');
    }
  };

  useEffect(() => {
    // Charger et initialiser le SDK Facebook si un App ID est défini
    const appId = process.env.REACT_APP_FACEBOOK_APP_ID;
    if (!appId) {
      console.warn('[Auth] REACT_APP_FACEBOOK_APP_ID manquant');
      return;
    }

    if (window.FB) return; // déjà chargé

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: false,
        version: 'v19.0'
      });
    };

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/fr_FR/sdk.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script && script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  const handleFacebookAuth = async () => {
    const appId = process.env.REACT_APP_FACEBOOK_APP_ID;
    if (!appId) {
      alert('Configuration Facebook manquante');
      return;
    }
    if (!window.FB) {
      alert('SDK Facebook non chargé');
      return;
    }

    window.FB.login(async (response) => {
      try {
        if (response?.authResponse?.accessToken) {
          const accessToken = response.authResponse.accessToken;
          const result = await dispatch(facebookLogin(accessToken)).unwrap();
          console.log('[Auth] Connexion Facebook réussie', { user: result?.user, hasToken: Boolean(result?.token) });
          navigate('/');
        } else {
          alert('Connexion Facebook annulée');
        }
      } catch (error) {
        console.error('[Auth] Facebook login error', error);
        const message = typeof error === 'string' ? error : (error?.message || 'Erreur de connexion Facebook');
        alert(message);
      }
    }, { scope: 'email,public_profile' });
  };

  const handleTestAdminLogin = () => {
    const { user, token } = createTestAdmin();
    dispatch({ type: 'auth/loginSuccess', payload: { user, token } });
    navigate('/admin');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <motion.div
          className="auth-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-header">
            <h1>{isLogin ? 'Connexion' : 'Inscription'}</h1>
            <p>
              {isLogin 
                ? 'Connectez-vous à votre compte CustomWear' 
                : 'Créez votre compte CustomWear'
              }
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form">
            {!isLogin && (
              <>
                <div className="form-group">
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
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
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
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
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
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
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
            </button>
          </form>

          <div className="divider">
            <span>ou</span>
          </div>

          <button onClick={handleGoogleAuth} className="google-btn">
            <FcGoogle />
            <span>Continuer avec Google</span>
          </button>
          {/* Suppression du conteneur de bouton Google rendu par Google Identity pour éviter la duplication */}

          <button onClick={handleFacebookAuth} className="facebook-btn">
            <FaFacebook color="#3b82f6" />
            <span>Continuer avec Facebook</span>
          </button>

          {ENABLE_TEST_ADMIN && isLogin && (
            <button onClick={handleTestAdminLogin} className="test-admin-btn">
              <FiShield />
              <span>Connexion Admin Test</span>
            </button>
          )}

          <div className="auth-switch">
            <p>
              {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="switch-btn"
              >
                {isLogin ? 'S\'inscrire' : 'Se connecter'}
              </button>
            </p>
          </div>

          {isLogin && (
            <div className="forgot-password">
              <Link to="/forgot-password">Mot de passe oublié ?</Link>
            </div>
          )}
        </motion.div>

        <motion.div
          className="auth-image"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img src="/auth-illustration.svg" alt="CustomWear" />
          <h2>Personnalisez vos vêtements</h2>
          <p>Créez des designs uniques et exprimez votre style personnel</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;