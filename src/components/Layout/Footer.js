import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Section principale */}
        <div className="footer-content">
          {/* À propos */}
          <div className="footer-section">
            <h3 className="footer-title">
              <span className="logo-text">CustomWear</span>
              <span className="logo-emoji">👕</span>
            </h3>
            <p className="footer-description">
              Votre destination pour la personnalisation et l'impression de produits de qualité. 
              Créez des designs uniques sur t-shirts, vestes, casquettes et vaisselle.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                <FaFacebook />
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <FaLinkedin />
              </a>
            </div>
          </div>

          {/* Navigation rapide */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Navigation</h4>
            <ul className="footer-links">
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/products">Tous les Produits</Link></li>
              <li><Link to="/products/tshirts">T-shirts</Link></li>
              <li><Link to="/products/vestes">Vestes</Link></li>
              <li><Link to="/products/casquettes">Casquettes</Link></li>
              <li><Link to="/products/vaisselle">Vaisselle</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Services</h4>
            <ul className="footer-links">
              <li><Link to="/customize">Personnalisation</Link></li>
              <li><Link to="/cart">Mon Panier</Link></li>
              <li><Link to="/profile">Mon Compte</Link></li>
              <li><a href="#support">Support Client</a></li>
              <li><a href="#shipping">Livraison</a></li>
              <li><a href="#returns">Retours</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Contact</h4>
            <div className="contact-info">
              <div className="contact-item">
                <FaMapMarkerAlt className="contact-icon" />
                <span>123 Rue de la Mode, 75001 Paris</span>
              </div>
              <div className="contact-item">
                <FaPhone className="contact-icon" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="contact-item">
                <FaEnvelope className="contact-icon" />
                <span>contact@customwear.fr</span>
              </div>
            </div>
            
            {/* Newsletter */}
            <div className="newsletter">
              <h5 className="newsletter-title">Newsletter</h5>
              <p className="newsletter-description">
                Recevez nos dernières offres et nouveautés
              </p>
              <form className="newsletter-form">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="newsletter-input"
                  required
                />
                <button type="submit" className="newsletter-button">
                  S'abonner
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Barre de séparation */}
        <div className="footer-divider"></div>

        {/* Section inférieure */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="footer-legal">
              <p>&copy; 2024 CustomWear. Tous droits réservés.</p>
              <div className="legal-links">
                <a href="#privacy">Politique de confidentialité</a>
                <a href="#terms">Conditions d'utilisation</a>
                <a href="#cookies">Cookies</a>
              </div>
            </div>
            
            <div className="payment-methods">
              <span className="payment-text">Moyens de paiement acceptés:</span>
              <div className="payment-icons">
                <div className="payment-icon">💳</div>
                <div className="payment-icon">🏦</div>
                <div className="payment-icon">📱</div>
                <div className="payment-icon">💰</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;