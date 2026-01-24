import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes, FaMicrophone, FaHome, FaBox, FaPalette, FaUserCircle, FaClipboardList, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaChartLine } from 'react-icons/fa';
import { Button } from '../ui/button';
import { logout, loadUser } from '../../store/slices/authSlice';
import ThemeSwitcher from './ThemeSwitcher';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);
  const userMenuRef = useRef(null);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnHomePage = location.pathname === '/';
  const isOnProductsPage = location.pathname.startsWith('/products');
  const isOnModelsPage = location.pathname.startsWith('/models');
  const isOnCustomizePage = location.pathname.startsWith('/customize');
  
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
    const term = searchQuery.trim();
    if (term) {
      let target;
      if (isOnModelsPage || isOnCustomizePage) {
        target = '/models';
      } else if (isOnProductsPage) {
        target = '/products';
      } else {
        target = '/search';
      }
      navigate(`${target}?search=${encodeURIComponent(term)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  // Recherche en temps réel: naviguer vers /products avec le terme saisi
  useEffect(() => {
    if (searchQuery === '') return;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const timer = setTimeout(() => {
      const term = searchQuery.trim();
      let target;
      if (isOnModelsPage || isOnCustomizePage) {
        target = '/models';
      } else if (isOnProductsPage) {
        target = '/products';
      } else {
        target = '/search';
      }
      navigate(`${target}?search=${encodeURIComponent(term)}`);
    }, 300);
    setDebounceTimer(timer);

    return () => clearTimeout(timer);
  }, [searchQuery, navigate, isOnModelsPage, isOnCustomizePage, isOnProductsPage]);

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

  // Masquer la navbar au scroll (mobile uniquement)
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) {
        setIsHidden(false);
        lastScrollY.current = current;
        return;
      }
      if (!isMenuOpen) {
        if (current > lastScrollY.current && current > 20) {
          setIsHidden(true);
        } else {
          setIsHidden(false);
        }
      } else {
        setIsHidden(false);
      }
      lastScrollY.current = current;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  return (
    <nav className={`navbar ${isHidden ? 'hidden' : ''}`}>
      <div className="navbar-top">
      <div className="navbar-container">
        {/* Logo */}
        <Button asChild variant="ghost" className="navbar-logo-button">
          <Link to="/" className="navbar-logo" onClick={() => setIsMenuOpen(false)}>
            <img src="/LogoCustomWear.png" alt="CustomWear Logo" className="navbar-logo-img" />
             <h3 className="footer-title">
              <span className="logo-emoji">👕</span>
            </h3>
          </Link>
        </Button>

        {/* Menu Desktop */}
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">
            <FaHome className="navbar-icon" />
            Accueil
          </Link>
          <Link to="/products" className="navbar-link">
            <FaBox className="navbar-icon" />
            Produits disponibles
          </Link>
          <Link to="/models" className="navbar-link">
            <FaPalette className="navbar-icon" />
            Produits personnalisables
          </Link>
          
        </div>

        {/* Barre de recherche déplacée vers la sous-barre ci-dessous */}

        {/* Actions */}
        <div className="navbar-actions">
          <ThemeSwitcher />
          {/* Accueil (mobile icône) */}
          <Link to="/" className="navbar-action home-mobile" aria-label="Accueil">
            <FaHome />
          </Link>
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
                {/* <span className="user-name">{user?.name}</span> */}
              </button>
              <div className={`user-dropdown ${isUserDropdownOpen ? 'open' : ''}`}>
                <Link to="/profile" className="dropdown-link">
                  <FaUserCircle className="dropdown-icon" />
                  Mon Profil
                </Link>
                <Link to="/orders" className="dropdown-link">
                <FaClipboardList className="dropdown-icon" />
                Mes Commandes
              </Link>
              {(user?.role === 'admin' || user?.role === 'moderator') && (
                <Link to="/admin" className="dropdown-link">
                  <FaChartLine className="dropdown-icon" />
                  Dashboard Admin
                </Link>
              )}
              <button onClick={handleLogout} className="dropdown-link logout-btn">
                  <FaSignOutAlt className="dropdown-icon" />
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
                <Link to="/auth" className="navbar-link">
                  <FaSignInAlt className="navbar-icon" />
                  Connexion
                </Link>
                <Link to="/auth?mode=register" className="navbar-button">
                  <FaUserPlus className="navbar-icon" />
                  Inscription
                </Link>
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
              placeholder={(isOnModelsPage || isOnCustomizePage) ? "Rechercher un modèle..." : "Rechercher un produit..."} 
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
              placeholder={(isOnModelsPage || isOnCustomizePage) ? "Rechercher un modèle..." : "Rechercher..."}
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
            <FaHome className="mobile-icon" />
            Accueil
          </Link>
          <Link to="/products" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            <FaBox className="mobile-icon" />
            Produits disponibles
          </Link>

          <Link to="/models" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
            <FaPalette className="mobile-icon" />
            Produits personnalisables
          </Link>
          
          {!isOnModelsPage && !isOnCustomizePage && !isOnHomePage && !isOnProductsPage && (
            <>
              <Link to="/products/t-shirts" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                T-shirts
              </Link>
              <Link to="/products/vestes" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                Vestes
              </Link>
              <Link to="/products/casquettes" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                Casquettes
              </Link>
              <Link to="/products/bonnets" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                Bonnets
              </Link>
              <Link to="/products/vaisselle" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                Vaisselle
              </Link>
            </>
          )}
          
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                <FaUserCircle className="mobile-icon" />
                Mon Profil
              </Link>
              <Link to="/orders" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                <FaClipboardList className="mobile-icon" />
                Mes Commandes
              </Link>
              <button onClick={handleLogout} className="mobile-link logout-mobile">
                <FaSignOutAlt className="mobile-icon" />
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                <FaSignInAlt className="mobile-icon" />
                Connexion
              </Link>
              <Link to="/auth?mode=register" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                <FaUserPlus className="mobile-icon" />
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
