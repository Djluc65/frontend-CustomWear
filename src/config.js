// Configuration de l'API
// Centralise la logique de l'URL de base pour éviter les incohérences entre les services et les slices

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const isVercel = typeof window !== 'undefined' && /\.vercel\.app$/.test(window.location.hostname);
  if (isVercel) {
    return 'https://backend-custom-wear.vercel.app';
  }
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) 
    ? window.location.hostname 
    : 'localhost';
    
  const PORT = 5000;
  
  return `http://${hostname}:${PORT}`;
};

export const API_BASE_URL = getApiUrl();
