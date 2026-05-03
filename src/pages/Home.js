import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaPalette, FaTruck, FaShieldAlt, FaStar, FaArrowRight, FaCalendarAlt, FaPenNib } from 'react-icons/fa';
import { fetchFeaturedProducts } from '../store/slices/productsSlice';
import ProductCard from '../components/Products/ProductCard';
import './Home.css';

const Home = () => {
  const dispatch = useDispatch();
  const { featuredProducts, isLoading, featuredProductsFetched } = useSelector((state) => state.products);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!featuredProductsFetched && !isLoading) {
      dispatch(fetchFeaturedProducts());
    }
  }, [dispatch, featuredProductsFetched, isLoading]);

  const features = [
    {
      icon: <FaPalette />,
      title: "Personnalisation Unique",
      description: "Créez des designs uniques avec nos outils de personnalisation avancés"
    },
    {
      icon: <FaTruck />,
      title: "Livraison Rapide",
      description: "Livraison gratuite sous 48h pour toutes vos commandes"
    },
    {
      icon: <FaShieldAlt />,
      title: "Qualité Garantie",
      description: "Produits de haute qualité avec garantie satisfaction"
    },
    {
      icon: <FaStar />,
      title: "Service Client",
      description: "Support client 24/7 pour vous accompagner"
    }
  ];

  const categories = [
    {
      name: "T-shirts",
      image: "👕",
      description: "Personnalisez vos t-shirts avec vos designs préférés",
      link: "/products/tshirts"
    },
    {
      name: "Vestes",
      image: "🧥",
      description: "Vestes personnalisées pour toutes les saisons",
      link: "/products/vestes"
    },
    {
      name: "Casquettes",
      image: "🧢",
      description: "Casquettes tendance avec vos motifs personnalisés",
      link: "/products/casquettes"
    },
    {
      name: "Vaisselle",
      image: "🍽️",
      description: "Mugs et vaisselle personnalisés pour vos moments spéciaux",
      link: "/products/vaisselle"
    }
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      rating: 5,
      comment: "Service exceptionnel ! Ma commande personnalisée était parfaite.",
      avatar: "👩‍💼"
    },
    {
      name: "Pierre Martin",
      rating: 5,
      comment: "Qualité au top et livraison ultra rapide. Je recommande !",
      avatar: "👨‍💻"
    },
    {
      name: "Sophie Laurent",
      rating: 5,
      comment: "L'outil de personnalisation est fantastique, très facile à utiliser.",
      avatar: "👩‍🎨"
    }
  ];

  return (
    <div className="home">
      {/* Section Hero */}
      <section className="hero">
        <div className="hero-content">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="hero-title">
              Créez des Produits <span className="highlight">Uniques</span>
            </h1>
            <p className="hero-description">
              Personnalisez et imprimez vos designs sur t-shirts, vestes, casquettes, bonnets et vaisselle. 
              Exprimez votre créativité avec CustomWear !
            </p>
            <div className="hero-buttons">
              <Link to="/products" className="btn btn-primary">
                <FaShoppingCart />
                Découvrir nos Produits
              </Link>
              <Link to="/models" className="btn btn-secondary">
                 <FaPalette />
                 Personnaliser Maintenant
              </Link>
              <Link to="/events" className="btn btn-outline">
                <FaCalendarAlt />
                Événements
              </Link>
              <Link to="/design" className="btn btn-outline">
                <FaPenNib />
                Créer mon design
              </Link>
              {isAuthenticated && user?.role === 'admin' && (
                <Link to="/admin/login" className="btn btn-outline" style={{ marginTop: '10px', fontSize: '0.9em' }}>
                  Admin Dashboard
                </Link>
              )}
            </div>
          </motion.div>
          
          <motion.div
            className="hero-image"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="hero-product-showcase">
              <div className="showcase-item">👕</div>
              <div className="showcase-item">🧥</div>
              <div className="showcase-item">🧢</div>
              <div className="showcase-item">☕</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section Catégories */}
      <section className="categories-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Nos Catégories</h2>
            <p className="section-description">
              Découvrez notre large gamme de produits personnalisables
            </p>
          </motion.div>

          <div className="categories-grid">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                className="category-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <div className="category-image">
                  <span className="category-emoji">{category.image}</span>
                </div>
                <h3 className="category-name">{category.name}</h3>
                <p className="category-description">{category.description}</p>
                <Link to={category.link} className="category-link">
                  Voir les produits <FaArrowRight />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Produits Vedettes */}
      <section className="featured-products">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Produits Vedettes</h2>
            <p className="section-description">
              Découvrez nos produits les plus populaires
            </p>
          </motion.div>

          {isLoading ? (
            <div className="loading-grid">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="product-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-price"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts?.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="section-footer">
            <Link to="/products" className="btn btn-outline">
              Voir tous les produits <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section className="features-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Pourquoi Choisir CustomWear ?</h2>
            <p className="section-description">
              Nous offrons la meilleure expérience de personnalisation
            </p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="testimonials-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Ce que disent nos clients</h2>
            <p className="section-description">
              Découvrez les avis de nos clients satisfaits
            </p>
          </motion.div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                className="testimonial-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="testimonial-content">
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="star" />
                    ))}
                  </div>
                  <p className="testimonial-comment">"{testimonial.comment}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-name">{testimonial.name}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="cta-title">Prêt à créer quelque chose d'unique ?</h2>
            <p className="cta-description">
              Commencez dès maintenant à personnaliser vos produits préférés
            </p>
            <div className="cta-buttons">
              <Link to="/customize" className="btn btn-primary btn-large">
                <FaPalette />
                Commencer la Personnalisation
              </Link>
              <Link to="/products" className="btn btn-outline btn-large">
                <FaShoppingCart />
                Parcourir le Catalogue
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
