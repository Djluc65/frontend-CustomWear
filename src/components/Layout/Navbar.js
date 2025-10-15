import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes, FaMicrophone } from 'react-icons/fa';
import { logout, loadUser } from '../../store/slices/authSlice';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userMenuRef = useRef(null);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { totalQuantity } = useSelector(state => state.cart);

  useEffect(() => {
    // Charger l'utilisateur au démarrage si un token existe
    const token = localStorage.getItem('token');
    if (token && !user) {
      dispatch(loadUser());
    }
  }, [dispatch, user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  // Recherche en temps réel: naviguer vers /products avec le terme saisi
  useEffect(() => {
    // Ne pas déclencher si la valeur est vide; possibilité de nettoyer
    if (searchQuery === '') return;

    // Debounce pour limiter la navigation
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const timer = setTimeout(() => {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }, 300);
    setDebounceTimer(timer);

    return () => clearTimeout(timer);
  }, [searchQuery, navigate]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Fermer dropdown utilisateur au changement de route
  useEffect(() => {
    setIsUserDropdownOpen(false);
  }, [location.pathname]);

  // Fermer dropdown si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Empêcher le scroll arrière-plan quand le menu mobile est ouvert
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-top">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setIsMenuOpen(false)}>
          
          <span className="logo-text">CustomWear</span>
          <span className="logo-emoji">👕</span>
        </Link>

        {/* Menu Desktop */}
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">Accueil</Link>
          <Link to="/products" className="navbar-link">Produits</Link>
          <Link to="/products/t-shirts" className="navbar-link">T-shirts</Link>
          <Link to="/products/vestes" className="navbar-link">Vestes</Link>
          <Link to="/products/casquettes" className="navbar-link">Casquettes</Link>
          <Link to="/products/vaisselle" className="navbar-link">Vaisselle</Link>
        </div>

        {/* Barre de recherche déplacée vers la sous-barre ci-dessous */}

        {/* Actions */}
        <div className="navbar-actions">
          {/* Panier */}
          <Link to="/cart" className="navbar-action cart-link">
            <FaShoppingCart />
            {totalQuantity > 0 && (
              <span className="cart-badge">{totalQuantity}</span>
            )}
          </Link>

          {/* Utilisateur */}
          {isAuthenticated ? (
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="navbar-action user-button"
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={isUserDropdownOpen}
              >
                <FaUser />
                <span className="user-name">{user?.name}</span>
              </button>
              <div className={`user-dropdown ${isUserDropdownOpen ? 'open' : ''}`}>
                <Link to="/profile" className="dropdown-link">Mon Profil</Link>
                <Link to="/orders" className="dropdown-link">Mes Commandes</Link>
                <button onClick={handleLogout} className="dropdown-link logout-btn">
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Icône Connexion (mobile uniquement) */}
              <Link to="/auth" className="navbar-action login-mobile" aria-label="Connexion">
                <FaUser />
              </Link>
              {/* Liens texte (desktop) */}
              <div className="auth-links">
                <Link to="/auth" className="navbar-link">Connexion</Link>
                <Link to="/auth?mode=register" className="navbar-button">Inscription</Link>
              </div>
            </>
          )}
        </div>

        {/* Menu Mobile Toggle */}
        <button className="mobile-menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      </div>

      {/* Sous-barre de navigation (barre de recherche style YouTube) */}
      <div className="sub-navbar">
        <div className="sub-navbar-container">
          <form className="search-bar" onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            /> 
            <button type="submit" className="search-btn"> 
              <FaSearch /> 
            </button> 
            <div className="mic-btn" title="Recherche vocale (à venir)"> 
              <FaMicrophone /> 
            </div>
          </form>
        </div>
      </div>

      {/* Menu Mobile */}
      <div className={`mobile-menu ${isMenuOpen ? 'mobile-menu-open' : ''}`}>
        <div className="mobile-search">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mobile-search-input"
            />
            <button type="submit" className="mobile-search-button">
              <FaSearch />
            </button>
          </form>
        </div>
        
        <div className="mobile-menu-links">
          <Link to="/" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            Accueil
          </Link>
          <Link to="/products" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            Tous les Produits
          </Link>
          <Link to="/products/t-shirts" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            T-shirts
          </Link>
          <Link to="/products/vestes" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            Vestes
          </Link>
          <Link to="/products/casquettes" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            Casquettes
          </Link>
          <Link to="/products/vaisselle" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            Vaisselle
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                Mon Profil
              </Link>
              <Link to="/orders" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                Mes Commandes
              </Link>
              <button onClick={handleLogout} className="mobile-link logout-mobile">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                Connexion
              </Link>
              <Link to="/auth?mode=register" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;