import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTheme, syncThemeWithUser } from '../../store/slices/themeSlice';
import { FaSun, FaMoon, FaTint } from 'react-icons/fa';
import './ThemeSwitcher.css';

const THEMES = [
  { value: 'light',     label: 'Light',     icon: <FaSun /> },
  { value: 'dark',      label: 'Dark',      icon: <FaMoon /> },
  { value: 'deep-blue', label: 'Deep Blue', icon: <FaTint /> },
];

const ThemeSwitcher = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector(state => state.theme);
  const { isAuthenticated } = useSelector(state => state.auth);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleThemeChange = (newTheme) => {
    dispatch(setTheme(newTheme));
    if (isAuthenticated) dispatch(syncThemeWithUser(newTheme));
    setIsOpen(false);
  };

  /* Close on outside click */
  useEffect(() => {
    const onOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  /* Close on Escape */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const currentTheme = THEMES.find(t => t.value === theme) ?? THEMES[0];

  return (
    <div className="theme-switcher" ref={dropdownRef}>

      {/* ── Toggle button ── */}
      <button
        className="theme-toggle-btn"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Thème actuel : ${currentTheme.label}. Cliquer pour changer.`}
        title="Changer de thème"
      >
        {currentTheme.icon}
      </button>

      {/* ── Dropdown ── */}
      <div
        className={`theme-dropdown ${isOpen ? 'open' : ''}`}
        role="listbox"
        aria-label="Choisir un thème"
      >
        {THEMES.map(({ value, label, icon }) => (
          <button
            key={value}
            className={`theme-option ${theme === value ? 'active' : ''}`}
            data-theme-value={value}
            role="option"
            aria-selected={theme === value}
            onClick={() => handleThemeChange(value)}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

    </div>
  );
};

export default ThemeSwitcher;