// Script de test pour vérifier l'accès admin
import { createTestAdmin } from './testAuth';

export const simulateAdminLogin = () => {
  const { user, token } = createTestAdmin();
  
  // Simuler la connexion en stockant les données dans localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  console.log('Admin test login simulated:', { user, token });
  
  return { user, token };
};

export const checkAdminAccess = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    console.log('No admin session found');
    return false;
  }
  
  try {
    const user = JSON.parse(userStr);
    const isAdmin = user.role === 'admin';
    console.log('Admin access check:', { isAdmin, user });
    return isAdmin;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return false;
  }
};

export const clearAdminSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('Admin session cleared');
};