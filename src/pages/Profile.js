import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit3, FiSave, FiX } from 'react-icons/fi';
import { updateProfile, uploadAvatar, loadUser } from '../store/slices/authSlice';
import './Profile.css';
import { usersAPI } from '../services/api';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector(state => state.auth);
  
  const getDefaultAddress = (u) => {
    if (!u?.addresses || u.addresses.length === 0) return null;
    const domicDefault = u.addresses.find(a => a.type === 'domicile' && a.isDefault);
    if (domicDefault) return domicDefault;
    const domicAny = u.addresses.find(a => a.type === 'domicile');
    return domicAny || u.addresses[0];
  };

  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: getDefaultAddress(user)?.street || '',
    city: getDefaultAddress(user)?.city || '',
    postalCode: getDefaultAddress(user)?.postalCode || '',
    country: getDefaultAddress(user)?.country || 'France'
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Synchroniser le formulaire lorsque les données utilisateur changent
  useEffect(() => {
    const addr = getDefaultAddress(user);
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: addr?.street || '',
      city: addr?.city || '',
      postalCode: addr?.postalCode || '',
      country: addr?.country || 'France'
    });
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSave = async () => {
    try {
      if (avatarFile) {
        await dispatch(uploadAvatar(avatarFile)).unwrap();
        setAvatarFile(null);
        setAvatarPreview(null);
      }
      await dispatch(updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      })).unwrap();

      const street = formData.address?.trim();
      const city = formData.city?.trim();
      const postalCode = formData.postalCode?.trim();
      const country = (formData.country || 'France').trim();

      if (street && city && postalCode) {
        const res = await usersAPI.getAddresses();
        const addresses = res?.data?.data?.addresses || [];
        const currentDefault = addresses.find(a => a.type === 'domicile' && a.isDefault) || addresses.find(a => a.type === 'domicile') || addresses[0];
        const payload = {
          type: 'domicile',
          street,
          city,
          postalCode,
          country,
          isDefault: true
        };
        if (currentDefault?._id) {
          await usersAPI.updateAddress(currentDefault._id, payload);
        } else {
          await usersAPI.createAddress(payload);
        }
      }

      await dispatch(loadUser()).unwrap();
      setIsEditing(false);
      setStatusMessage('Profil mis à jour avec succès');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error('Update error:', error);
      setStatusMessage('Une erreur est survenue lors de la mise à jour');
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleCancel = () => {
    const addr = getDefaultAddress(user);
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: addr?.street || '',
      city: addr?.city || '',
      postalCode: addr?.postalCode || '',
      country: addr?.country || 'France'
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {statusMessage && (
          <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: 6, background: '#e6ffed', color: '#046b1d' }}>
            {statusMessage}
          </div>
        )}
        <motion.div
          className="profile-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="profile-avatar">
            <img 
              src={avatarPreview || user?.avatar || '/default-avatar.png'} 
              alt="Profile" 
            />
            {isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  className="avatar-edit-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Changer la photo
                </button>
              </>
            )}
          </div>
          <div className="profile-info">
            <h1>{user?.firstName} {user?.lastName}</h1>
            <p>{user?.email}</p>
            <span className="member-since">
              Membre depuis {new Date(user?.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="profile-actions">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="edit-btn">
                <FiEdit3 />
                Modifier
              </button>
            ) : (
              <div className="edit-actions">
                <button onClick={handleSave} className="save-btn" disabled={isLoading}>
                  <FiSave />
                  Sauvegarder
                </button>
                <button onClick={handleCancel} className="cancel-btn" disabled={isLoading}>
                  <FiX />
                  Annuler
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="profile-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="profile-section">
            <h2>Informations personnelles</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <FiUser />
                  Prénom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                ) : (
                  <span>{user?.firstName}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <FiUser />
                  Nom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                ) : (
                  <span>{user?.lastName}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <FiMail />
                  Email (non modifiable)
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                  />
                ) : (
                  <span>{user?.email}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <FiPhone />
                  Téléphone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                ) : (
                  <span>{user?.phone || 'Non renseigné'}</span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Adresse de livraison</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>
                  <FiMapPin />
                  Adresse
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                ) : (
                  <span>{getDefaultAddress(user)?.street || 'Non renseignée'}</span>
                )}
              </div>

              <div className="form-group">
                <label>Ville</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                ) : (
                  <span>{getDefaultAddress(user)?.city || 'Non renseignée'}</span>
                )}
              </div>

              <div className="form-group">
                <label>Code postal</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  />
                ) : (
                  <span>{getDefaultAddress(user)?.postalCode || 'Non renseigné'}</span>
                )}
              </div>

              <div className="form-group">
                <label>Pays</label>
                {isEditing ? (
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                  >
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Canada">Canada</option>
                  </select>
                ) : (
                  <span>{getDefaultAddress(user)?.country || 'France'}</span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Statistiques</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Commandes</h3>
                <span className="stat-number">12</span>
              </div>
              <div className="stat-card">
                <h3>Total dépensé</h3>
                <span className="stat-number">€ 456.78</span>
              </div>
              <div className="stat-card">
                <h3>Produits favoris</h3>
                <span className="stat-number">8</span>
              </div>
              <div className="stat-card">
                <h3>Points fidélité</h3>
                <span className="stat-number">1,250</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;