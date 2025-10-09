import axios from 'axios';

// Configuration de base pour axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Instance axios avec configuration de base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les erreurs avec refresh token
let isRefreshing = false;
let pendingRequests = [];

const processQueue = (error, token = null) => {
  pendingRequests.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  pendingRequests = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Si 401 et on n'a pas déjà essayé un refresh pour cette requête
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // Pas de refresh token: nettoyer et rediriger
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Mettre en attente la requête jusqu'à ce que le refresh soit terminé
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject });
        })
          .then((newToken) => {
            // Réessayer avec le nouveau token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      try {
        isRefreshing = true;
        const refreshResponse = await api.post('/api/auth/refresh', { refreshToken });
        const newToken = refreshResponse?.data?.data?.token || refreshResponse?.data?.token;

        if (newToken) {
          // Mettre à jour le token
          localStorage.setItem('token', newToken);
          api.defaults.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          // Réessayer la requête originale
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        // Pas de token retourné: nettoyage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        processQueue(new Error('No token from refresh'), null);
        window.location.href = '/auth';
        return Promise.reject(error);
      } catch (refreshError) {
        // Échec du refresh: nettoyage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        processQueue(refreshError, null);
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Pour autres erreurs ou si déjà réessayé
    return Promise.reject(error);
  }
);

// Services API pour l'administration
export const adminAPI = {
  // Statistiques du dashboard
  getDashboardStats: () => api.get('/api/admin/stats'),
  
  // Gestion des utilisateurs
  getAllUsers: (params = {}) => api.get('/api/admin/users', { params }),
  updateUserStatus: (userId, status) => api.put(`/api/admin/users/${userId}/status`, { status }),
  
  // Gestion des commandes
  getAllOrders: (params = {}) => api.get('/api/admin/orders', { params }),
  updateOrderStatus: (orderId, status) => api.put(`/api/admin/orders/${orderId}/status`, { status }),
  
  // Gestion des produits
  getAllProducts: (params = {}) => api.get('/api/admin/products', { params }),
  createProduct: (productData) => api.post('/api/admin/products', productData),
  updateProduct: (productId, productData) => api.put(`/api/admin/products/${productId}`, productData),
  deleteProduct: (productId) => api.delete(`/api/admin/products/${productId}`),
  // Upload d'images
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api.post('/api/admin/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Services API pour l'authentification
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (userData) => api.put('/api/users/profile', userData),
};

// Services API pour les produits (côté client)
export const productsAPI = {
  getAllProducts: (params = {}) => api.get('/api/products', { params }),
  getProduct: (productId) => api.get(`/api/products/${productId}`),
  getCategories: () => api.get('/api/products/categories'),
};

// Services API pour les commandes (côté client)
export const ordersAPI = {
  createOrder: (orderData) => api.post('/api/orders', orderData),
  getUserOrders: () => api.get('/api/orders/user'),
  getOrder: (orderId) => api.get(`/api/orders/${orderId}`),
};

// Export par défaut de l'instance axios configurée
export default api;