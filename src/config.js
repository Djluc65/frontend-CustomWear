// Configuration de l'API
// Centralise la logique de l'URL de base pour éviter les incohérences entre les services et les slices

const getApiUrl = () => {
  // 1. Si une URL est définie dans l'environnement, l'utiliser
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Sinon, construire l'URL dynamiquement basée sur le hostname actuel
  // Cela permet de fonctionner sur mobile (IP locale) et desktop (localhost)
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) 
    ? window.location.hostname 
    : 'localhost';
    
  // Port par défaut du backend (5000 est standard pour Express, authSlice utilisait 5000)
  const PORT = 5000;
  
  return `http://${hostname}:${PORT}`;
};

export const API_BASE_URL = getApiUrl();
