// Configuration de l'API
// Centralise la logique de l'URL de base pour éviter les incohérences entre les services et les slices

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) 
    ? window.location.hostname 
    : 'localhost';
  const protocol = (typeof window !== 'undefined' && window.location && window.location.protocol)
    ? window.location.protocol
    : 'http:';
  const isVercel = /\.vercel\.app$/.test(hostname);
  const isCustomWearDomain = hostname === 'customwear.company' || hostname.endsWith('.customwear.company');
  const isHttpsProd = protocol === 'https:' && hostname !== 'localhost';

  if (isVercel || isCustomWearDomain || isHttpsProd) {
    return 'https://backend-custom-wear.vercel.app';
  }
    
  const PORT = 5000;
  
  return `http://${hostname}:${PORT}`;
};

export const API_BASE_URL = getApiUrl();
