import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  FiHome, 
  FiPackage, 
  FiLayers,
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
import { 
  fetchNotifications, 
  markAllRead, 
  markRead, 
  clearAll 
} from '../../store/slices/notificationsSlice';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { items: notifications, unreadCount } = useSelector(state => state.notifications);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const menuItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/admin/products', icon: FiPackage, label: 'Produits' },
    { path: '/admin/models', icon: FiLayers, label: 'Modèles' },
    { path: '/admin/orders', icon: FiShoppingBag, label: 'Commandes' },
    { path: '/admin/users', icon: FiUsers, label: 'Utilisateurs' },
    { path: '/admin/analytics', icon: FiBarChart2, label: 'Analytiques' },
    { path: '/admin/settings', icon: FiSettings, label: 'Paramètres' }
  ];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Init

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const isActiveRoute = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-slate-900 text-white shadow-xl transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}
          flex flex-col
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <Link to="/" className={`flex items-center gap-2 font-bold text-xl ${!sidebarOpen && !isMobile ? 'hidden' : ''} hover:opacity-80 transition-opacity`}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              C
            </div>
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">CustomWear</span>
          </Link>
          {(!sidebarOpen && !isMobile) && (
             <Link to="/" className="w-full flex justify-center hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">C</div>
             </Link>
          )}
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
              <FiX size={24} />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.path, item.exact);
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                      ${active 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                    title={!sidebarOpen && !isMobile ? item.label : ''}
                  >
                    <Icon className={`text-xl ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className={`${!sidebarOpen && !isMobile ? 'hidden' : 'block'} font-medium`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 mb-4 ${!sidebarOpen && !isMobile ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold shadow-inner">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className={`${!sidebarOpen && !isMobile ? 'hidden' : 'block'}`}>
              <div className="text-sm font-semibold text-white truncate w-32">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-slate-500">Administrateur</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors
              ${!sidebarOpen && !isMobile ? 'justify-center' : ''}
            `}
            title="Déconnexion"
          >
            <FiLogOut />
            <span className={`${!sidebarOpen && !isMobile ? 'hidden' : 'block'}`}>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FiMenu size={20} />
            </button>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">
              {menuItems.find(item => isActiveRoute(item.path, item.exact))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-10 w-64 bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>
            
            <div className="relative">
              <button 
                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-semibold text-slate-800">Notifications</span>
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => dispatch(markAllRead())} className="text-blue-600 hover:underline">Tout lire</button>
                      <button onClick={() => dispatch(clearAll())} className="text-slate-400 hover:text-slate-600">Vider</button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications && notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/50' : ''}`}
                          onMouseEnter={() => !n.read && dispatch(markRead(n.id))}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium text-slate-800">{n.title}</span>
                            <span className="text-xs text-slate-400">{new Date(n.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-400 text-sm">Aucune notification</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;