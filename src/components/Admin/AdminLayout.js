import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FiHome, 
  FiPackage, 
  FiShoppingBag, 
  FiUsers, 
  FiBarChart2, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiBell,
  FiSearch
} from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';
import './AdminLayout.css';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const menuItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/admin/products', icon: FiPackage, label: 'Produits' },
    { path: '/admin/orders', icon: FiShoppingBag, label: 'Commandes' },
    { path: '/admin/users', icon: FiUsers, label: 'Utilisateurs' },
    { path: '/admin/analytics', icon: FiBarChart2, label: 'Analytiques' },
    { path: '/admin/settings', icon: FiSettings, label: 'Paramètres' }
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const isActiveRoute = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <h2>CustomWear</h2>
            <span>Admin</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    className={`nav-link ${isActiveRoute(item.path, item.exact) ? 'active' : ''}`}
                  >
                    <Icon className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">Administrateur</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FiMenu />
            </button>
            <h1 className="page-title">
              {menuItems.find(item => isActiveRoute(item.path, item.exact))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="header-right">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="search-input"
              />
            </div>
            
            <button className="notification-btn">
              <FiBell />
              <span className="notification-badge">3</span>
            </button>

            <div className="header-user">
              <div className="user-avatar">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;