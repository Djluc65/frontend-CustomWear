import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaUserShield, FaEye, FaEyeSlash } from 'react-icons/fa';
import { loginAdmin } from '../../store/slices/authSlice';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select } from '../../components/ui/select';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-slate-700/50 bg-white/95 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/30">
                <FaUserShield className="text-3xl text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">Administration</CardTitle>
              <p className="text-sm text-slate-500 font-medium">Accès sécurisé CustomWear</p>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {error && (
                <motion.div 
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pseudo" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Pseudo</Label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      id="pseudo"
                      name="pseudo"
                      placeholder="Votre pseudo"
                      value={formData.pseudo}
                      onChange={handleChange}
                      className={`pl-10 ${validationErrors.pseudo ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {validationErrors.pseudo && (
                    <span className="text-xs font-medium text-red-500">{validationErrors.pseudo}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Email</Label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="admin@customwear.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-10 ${validationErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {validationErrors.email && (
                    <span className="text-xs font-medium text-red-500">{validationErrors.email}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Mot de passe</Label>
                  <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      placeholder="Votre mot de passe"
                      value={formData.password}
                      onChange={handleChange}
                      className={`pl-10 pr-10 ${validationErrors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <span className="text-xs font-medium text-red-500">{validationErrors.password}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Rôle</Label>
                  <div className="relative">
                    <FaUserShield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <Select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="pl-10 w-full"
                    >
                      <option value="admin">Administrateur</option>
                      <option value="moderator">Modérateur</option>
                    </Select>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-6 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <FaUserShield />
                      Se connecter
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
            
            <div className="border-t border-slate-100 p-4 text-center">
              <p className="text-xs font-medium text-slate-500">
                Accès sécurisé - Authentification requise
              </p>
            </div>
          </Card>
        </motion.div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-[50%] -left-[50%] h-[200%] w-[200%] animate-spin-slow opacity-30 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;