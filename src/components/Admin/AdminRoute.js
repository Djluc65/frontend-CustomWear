import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const location = useLocation();

  // Vérifier si l'utilisateur est connecté
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Vérifier si l'utilisateur a le rôle admin ou moderator
  if (!user || !['admin', 'moderator'].includes(user.role)) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h1>Accès Refusé</h1>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <p>Seuls les administrateurs et modérateurs peuvent accéder au dashboard admin.</p>
          <button onClick={() => window.history.back()}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;