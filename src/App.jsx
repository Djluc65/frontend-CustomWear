import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useSelector, useDispatch } from 'react-redux';
import { setThemeFromUser } from './store/slices/themeSlice';

// Import des composants
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Models from './pages/Models';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Customize from './pages/Customize';
import Search from './pages/Search';
import About from './pages/About';
import TestAdmin from './pages/TestAdmin';
import Events from './pages/Events';
import CreateDesign from './pages/CreateDesign';
import DesignSuccess from './pages/DesignSuccess';
import DesignCancel from './pages/DesignCancel';
import DesignMessages from './pages/DesignMessages';

// Import des composants Admin
import AdminRoute from './components/Admin/AdminRoute';
import AdminLayout from './components/Admin/AdminLayout';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminProductCreate from './pages/Admin/AdminProductCreate';
import AdminModels from './pages/Admin/AdminModels';
import AdminProductEdit from './pages/Admin/AdminProductEdit';
import AdminDesignRequests from './pages/Admin/AdminDesignRequests';

// Import des styles
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function ScrollToTop({ children }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    const path = location.pathname || '/';
    const brand = 'CustomWear';

    const routes = [
      { match: /^\/$/, title: `Accueil | ${brand}`, description: "CustomWear : vêtements personnalisés, modèles et designs uniques. Créez votre produit, ajoutez texte ou image, et commandez en ligne." },
      { match: /^\/products(\/.*)?$/, title: `Produits | ${brand}`, description: "Découvrez les produits CustomWear : modèles, catégories et nouveautés. Filtrez, comparez et commandez." },
      { match: /^\/product\/[^/]+$/, title: `Produit | ${brand}`, description: "Détails du produit CustomWear : options, images, stock et achat en ligne." },
      { match: /^\/models$/, title: `Modèles | ${brand}`, description: "Choisissez un modèle CustomWear puis personnalisez-le avec une image et/ou un texte." },
      { match: /^\/customize$/, title: `Personnalisation | ${brand}`, description: "Personnalisez votre modèle : ajoutez une image, du texte, et enregistrez votre création." },
      { match: /^\/events$/, title: `Événements | ${brand}`, description: "Événements saisonniers, collections et offres CustomWear." },
      { match: /^\/design(\/.*)?$/, title: `Créer mon design | ${brand}`, description: "Créez votre design personnalisé : brief, choix du pack et échange avec l'équipe." },
      { match: /^\/cart$/, title: `Panier | ${brand}`, description: "Votre panier CustomWear : produits, options et quantités avant paiement." },
      { match: /^\/checkout(\/.*)?$/, title: `Paiement | ${brand}`, description: "Finalisez votre commande CustomWear en toute sécurité." },
      { match: /^\/auth$/, title: `Connexion | ${brand}`, description: "Connectez-vous à CustomWear pour accéder à votre compte et à vos sauvegardes." },
      { match: /^\/profile$/, title: `Profil | ${brand}`, description: "Gérez votre profil et vos informations de compte CustomWear." },
      { match: /^\/about$/, title: `À propos | ${brand}`, description: "Découvrez CustomWear : notre mission, nos produits et notre qualité d'impression." },
      { match: /^\/search$/, title: `Recherche | ${brand}`, description: "Recherchez un produit ou un modèle sur CustomWear." },
      { match: /^\/admin(\/.*)?$/, title: `Admin | ${brand}`, description: "Espace administration CustomWear." },
    ];

    const match = routes.find((r) => r.match.test(path));
    const title = match?.title || `${brand} | Vêtements personnalisés`;
    const description =
      match?.description ||
      "CustomWear : vêtements personnalisés, modèles et designs uniques. Créez votre produit, ajoutez texte ou image, et commandez en ligne.";

    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute('content', description);
  }, [location.pathname]);

  return children;
}

function App() {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.theme);
  const { user } = useSelector((state) => state.auth);

  // Appliquer le thème au montage et au changement
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Synchroniser le thème avec l'utilisateur connecté
  useEffect(() => {
    if (user && user.preferences && user.preferences.theme) {
      dispatch(setThemeFromUser(user.preferences.theme));
    }
  }, [user, dispatch]);

  return (
    <ScrollToTop>
      <div className="App">
        <Routes>
          {/* Route de connexion admin (non protégée) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Routes Admin protégées */}
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/create" element={<AdminProductCreate />} />
            <Route path="products/new" element={<AdminProductCreate />} />
            <Route path="products/:id/edit" element={<AdminProductEdit />} />
            <Route path="models" element={<AdminModels />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="design-requests" element={<AdminDesignRequests />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Routes publiques */}
          <Route path="/*" element={
            <>
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:category" element={<Products />} />
                  <Route path="/models" element={<Models />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/success" element={<CheckoutSuccess />} />
                  <Route path="/checkout/cancel" element={<CheckoutCancel />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/customize" element={<Customize />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/design" element={<CreateDesign />} />
                  <Route path="/design/success" element={<DesignSuccess />} />
                  <Route path="/design/cancel" element={<DesignCancel />} />
                  <Route path="/design/messages" element={<DesignMessages />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/test-admin" element={<TestAdmin />} />
                </Routes>
              </main>
              <Footer />
            </>
          } />
        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </ScrollToTop>
  );
}

export default App;
