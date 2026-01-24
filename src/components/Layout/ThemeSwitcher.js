import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTheme, syncThemeWithUser } from '../../store/slices/themeSlice';
import { FaSun, FaMoon, FaTint } from 'react-icons/fa';
import './ThemeSwitcher.css';

const ThemeSwitcher = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.theme);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleThemeChange = (newTheme) => {
    dispatch(setTheme(newTheme));
    if (isAuthenticated) {
      dispatch(syncThemeWithUser(newTheme));
    }
  };

  return (
    <div className="theme-switcher">
      <div className="theme-options">
        <button
          className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
          onClick={() => handleThemeChange('light')}
          title="Thème Clair"
          aria-label="Activer le thème clair"
        >
          <FaSun />
          <span className="theme-label">Light</span>
        </button>
        
        <button
          className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => handleThemeChange('dark')}
          title="Thème Sombre"
          aria-label="Activer le thème sombre"
        >
          <FaMoon />
          <span className="theme-label">Dark</span>
        </button>
        
        <button
          className={`theme-btn ${theme === 'deep-blue' ? 'active' : ''}`}
          onClick={() => handleThemeChange('deep-blue')}
          title="Thème Deep Blue"
          aria-label="Activer le thème Deep Blue"
        >
          <FaTint />
          <span className="theme-label">Blue</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
