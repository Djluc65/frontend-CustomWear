import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiShield } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';
import { loginUser, registerUser, facebookLogin, googleLogin } from '../store/slices/authSlice';
import { FaFacebook } from 'react-icons/fa';
import { createTestAdmin } from '../utils/testAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';

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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      if (!credential) return;
      
      const result = await dispatch(googleLogin(credential)).unwrap();
      console.log('[Auth] Connexion Google réussie', { user: result?.user });
      navigate('/');
    } catch (error) {
      console.error('[Auth] Google login error', error);
      const message = typeof error === 'string' ? error : (error?.message || 'Erreur de connexion Google');
      alert(message);
    }
  };

  const handleGoogleError = () => {
    console.error('[Auth] Google Login Failed');
    alert('Échec de la connexion Google');
  };

  const handleFacebookSuccess = async (response) => {
    try {
      if (response?.accessToken) {
        const result = await dispatch(facebookLogin(response.accessToken)).unwrap();
        console.log('[Auth] Connexion Facebook réussie', { user: result?.user });
        navigate('/');
      }
    } catch (error) {
      console.error('[Auth] Facebook login error', error);
      const message = typeof error === 'string' ? error : (error?.message || 'Erreur de connexion Facebook');
      alert(message);
    }
  };

  const handleFacebookFail = (error) => {
    console.error('[Auth] Facebook Login Failed', error);
    // Ne pas afficher d'alerte si l'utilisateur a annulé ou fermé la fenêtre
    if (error?.status === 'unknown') return;
    alert('Échec de la connexion Facebook');
  };

  const handleTestAdminLogin = () => {
    const { user, token } = createTestAdmin();
    dispatch({ type: 'auth/loginSuccess', payload: { user, token } });
    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-2xl rounded-2xl border-0">
        <motion.div
          className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1 bg-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile Toggle for Login/Register */}
          <div className="flex w-full mb-8 bg-slate-100 p-1 rounded-lg">
            <Button
              type="button"
              variant="ghost"
              className={`flex-1 ${isLogin ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'}`}
              onClick={() => setIsLogin(true)}
            >
              Connexion
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={`flex-1 ${!isLogin ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'}`}
              onClick={() => setIsLogin(false)}
            >
              Inscription
            </Button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{isLogin ? 'Bon retour !' : 'Créer un compte'}</h1>
            <p className="text-gray-500">
              {isLogin 
                ? 'Connectez-vous pour accéder à vos designs' 
                : 'Rejoignez la communauté CustomWear'
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                    <Input
                      type="text"
                      placeholder="Prénom"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                    <Input
                      type="text"
                      placeholder="Nom"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirmer le mot de passe"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">ou</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-center w-full">
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

            <div className="flex justify-center w-full">
              <FacebookLogin
                appId={process.env.REACT_APP_FACEBOOK_APP_ID || "123456789012345"}
                onSuccess={handleFacebookSuccess}
                onFail={handleFacebookFail}
                onProfileSuccess={(response) => console.log('Get Profile Success!', response)}
                render={({ onClick }) => (
                  <Button onClick={onClick} variant="outline" className="w-full max-w-[350px] flex items-center justify-center gap-2 h-[40px] border-[#dadce0] hover:bg-slate-50">
                    <FaFacebook className="text-[#1877F2] text-xl" />
                    <span className="font-medium text-gray-600">Continuer avec Facebook</span>
                  </Button>
                )}
              />
            </div>

            {ENABLE_TEST_ADMIN && isLogin && (
              <Button onClick={handleTestAdminLogin} variant="ghost" className="w-full text-gray-600 flex items-center gap-2">
                <FiShield />
                <span>Connexion Admin Test</span>
              </Button>
            )}
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline focus:outline-none"
            >
              {isLogin ? 'S\'inscrire' : 'Se connecter'}
            </button>
          </div>

          {isLogin && (
            <div className="mt-4 text-center">
              <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-gray-900 hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          className="hidden md:flex flex-col justify-center items-center bg-gray-50 p-12 order-1 md:order-2 text-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img src="/auth-illustration.svg" alt="CustomWear" className="w-full max-w-md mb-8" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Personnalisez vos vêtements</h2>
          <p className="text-gray-600 max-w-sm">
            Créez des designs uniques et exprimez votre style personnel avec notre outil de personnalisation avancé.
          </p>
        </motion.div>
      </Card>
    </div>
  );
};

export default Auth;