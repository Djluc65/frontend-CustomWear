import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTheme, syncThemeWithUser } from '../../store/slices/themeSlice';
import { FaSun, FaMoon, FaTint, FaPalette } from 'react-icons/fa';
import './ThemeSwitcher.css';

const ThemeSwitcher = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.theme);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleThemeChange = (newTheme) => {
    dispatch(setTheme(newTheme));
    if (isAuthenticated) {
      dispatch(syncThemeWithUser(newTheme));
    }
    setIsOpen(false);
  };

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <FaSun />;
      case 'dark': return <FaMoon />;
      case 'deep-blue': return <FaTint />;
      default: return <FaPalette />;
    }
  };

  return (
    <div className="theme-switcher" ref={dropdownRef}>
      <button 
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Changer de thème"
      >
        {getThemeIcon()}
        {/* <span className="theme-current-label">{theme}</span> */}
      </button>

      <div className={`theme-dropdown ${isOpen ? 'open' : ''}`}>
        <button
          className={`theme-option ${theme === 'light' ? 'active' : ''}`}
          onClick={() => handleThemeChange('light')}
        >
          <FaSun />
          <span>Light</span>
        </button>
        
        <button
          className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => handleThemeChange('dark')}
        >
          <FaMoon />
          <span>Dark</span>
        </button>
        
        <button
          className={`theme-option ${theme === 'deep-blue' ? 'active' : ''}`}
          onClick={() => handleThemeChange('deep-blue')}
        >
          <FaTint />
          <span>Deep Blue</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
