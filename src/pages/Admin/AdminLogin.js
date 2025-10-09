import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaUserShield, FaEye, FaEyeSlash } from 'react-icons/fa';
import { loginAdmin } from '../../store/slices/authSlice';
import './AdminLogin.css';

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    pseudo: '',
    email: '',
    password: '',
    role: 'admin'
  });
  
  const [validationErrors, setValidationErrors] = useState({});

  // Rediriger si déjà connecté en tant qu'admin
  useEffect(() => {
    if (isAuthenticated && user && (user.role === 'admin' || user.role === 'moderator')) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.pseudo.trim()) {
      errors.pseudo = 'Le pseudo est requis';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const result = await dispatch(loginAdmin(formData));
      if (loginAdmin.fulfilled.match(result)) {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <motion.div 
          className="admin-login-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="admin-login-header">
            <div className="admin-icon">
              <FaUserShield />
            </div>
            <h1>Administration CustomWear</h1>
            <p>Accès réservé aux administrateurs</p>
          </div>

          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="pseudo">Pseudo</label>
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="pseudo"
                  name="pseudo"
                  placeholder="Votre pseudo"
                  value={formData.pseudo}
                  onChange={handleChange}
                  required
                />
              </div>
              {validationErrors.pseudo && (
                <span className="error-text">{validationErrors.pseudo}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="admin@customwear.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {validationErrors.email && (
                <span className="error-text">{validationErrors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Votre mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {validationErrors.password && (
                <span className="error-text">{validationErrors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="role">Rôle</label>
              <div className="input-wrapper">
                <FaUserShield className="input-icon" />
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="admin">Administrateur</option>
                  <option value="moderator">Modérateur</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="admin-submit-btn" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <FaUserShield />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          <div className="admin-footer">
            <p>Accès sécurisé - Authentification requise</p>
          </div>
        </motion.div>

        <div className="admin-background">
          <div className="admin-pattern"></div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;