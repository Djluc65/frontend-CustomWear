import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiType, FiImage, FiDroplet, FiRotateCw, FiDownload, FiShoppingCart } from 'react-icons/fi';
import { addToCart } from '../store/slices/cartSlice';
import './Customize.css';

const Customize = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canvasRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('text');
  const [customization, setCustomization] = useState({
    text: '',
    font: 'Arial',
    fontSize: 24,
    color: '#000000',
    position: { x: 50, y: 50 },
    rotation: 0,
    image: null,
    imagePosition: { x: 50, y: 50 },
    imageSize: 100
  });

  const [product] = useState({
    id: productId,
    name: 'T-shirt Premium',
    basePrice: 29.99,
    image: '/t-shirt-template.png'
  });

  const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana'];
  const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

  const handleTextChange = (field, value) => {
    setCustomization(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomization(prev => ({
          ...prev,
          image: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddToCart = () => {
    const customizedProduct = {
      ...product,
      customization: customization,
      price: product.basePrice + 5, // Prix de personnalisation
      quantity: 1
    };
    
    dispatch(addToCart(customizedProduct));
    navigate('/cart');
  };

  const downloadDesign = () => {
    // Logique pour télécharger le design
    console.log('Downloading design...');
  };

  return (
    <div className="customize-page">
      <div className="customize-header">
        <h1>Personnaliser votre produit</h1>
        <p>Créez un design unique pour votre {product.name}</p>
      </div>

      <div className="customize-content">
        <div className="customize-tools">
          <div className="tool-tabs">
            <button
              className={`tab ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              <FiType />
              Texte
            </button>
            <button
              className={`tab ${activeTab === 'image' ? 'active' : ''}`}
              onClick={() => setActiveTab('image')}
            >
              <FiImage />
              Image
            </button>
            <button
              className={`tab ${activeTab === 'colors' ? 'active' : ''}`}
              onClick={() => setActiveTab('colors')}
            >
              <FiDroplet />
              Couleurs
            </button>
          </div>

          <div className="tool-content">
            {activeTab === 'text' && (
              <motion.div
                className="text-tools"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="form-group">
                  <label>Texte</label>
                  <input
                    type="text"
                    value={customization.text}
                    onChange={(e) => handleTextChange('text', e.target.value)}
                    placeholder="Entrez votre texte..."
                  />
                </div>

                <div className="form-group">
                  <label>Police</label>
                  <select
                    value={customization.font}
                    onChange={(e) => handleTextChange('font', e.target.value)}
                  >
                    {fonts.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Taille: {customization.fontSize}px</label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={customization.fontSize}
                    onChange={(e) => handleTextChange('fontSize', parseInt(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label>Rotation: {customization.rotation}°</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={customization.rotation}
                    onChange={(e) => handleTextChange('rotation', parseInt(e.target.value))}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'image' && (
              <motion.div
                className="image-tools"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="form-group">
                  <label>Télécharger une image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                  />
                </div>

                {customization.image && (
                  <>
                    <div className="form-group">
                      <label>Taille: {customization.imageSize}%</label>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={customization.imageSize}
                        onChange={(e) => handleTextChange('imageSize', parseInt(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'colors' && (
              <motion.div
                className="color-tools"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="form-group">
                  <label>Couleur du texte</label>
                  <div className="color-palette">
                    {colors.map(color => (
                      <button
                        key={color}
                        className={`color-option ${customization.color === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleTextChange('color', color)}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={customization.color}
                    onChange={(e) => handleTextChange('color', e.target.value)}
                    className="color-picker"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="customize-preview">
          <div className="preview-container">
            <div className="product-preview">
              <img src={product.image} alt={product.name} className="product-base" />
              
              {customization.text && (
                <div
                  className="text-overlay"
                  style={{
                    left: `${customization.position.x}%`,
                    top: `${customization.position.y}%`,
                    fontSize: `${customization.fontSize}px`,
                    fontFamily: customization.font,
                    color: customization.color,
                    transform: `translate(-50%, -50%) rotate(${customization.rotation}deg)`
                  }}
                >
                  {customization.text}
                </div>
              )}
              
              {customization.image && (
                <img
                  src={customization.image}
                  alt="Custom"
                  className="image-overlay"
                  style={{
                    left: `${customization.imagePosition.x}%`,
                    top: `${customization.imagePosition.y}%`,
                    width: `${customization.imageSize}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              )}
            </div>
          </div>

          <div className="preview-actions">
            <button onClick={downloadDesign} className="download-btn">
              <FiDownload />
              Télécharger
            </button>
            <button onClick={handleAddToCart} className="add-to-cart-btn">
              <FiShoppingCart />
              Ajouter au panier - {(product.basePrice + 5).toFixed(2)} €
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customize;