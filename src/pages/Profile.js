import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit3, FiSave, FiX, FiCamera } from 'react-icons/fi';
import { updateProfile, updateAvatar, removeAvatar } from '../store/slices/authSlice';
import './Profile.css';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postalCode: user?.postalCode || '',
    country: user?.country || 'France'
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      await dispatch(updateProfile(formData)).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      await dispatch(updateAvatar(file)).unwrap();
    } catch (error) {
      console.error('Avatar upload error:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      postalCode: user?.postalCode || '',
      country: user?.country || 'France'
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <motion.div
          className="profile-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="profile-avatar">
            <img 
              src={user?.avatar || '/default-avatar.png'} 
              alt="Profile" 
            />
            {isEditing && (
              <>
                <input
                  id="avatarUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="avatar-upload-input"
                />
                <div className="avatar-actions">
                  <button
                    type="button"
                    className="change-avatar-btn"
                    onClick={() => document.getElementById('avatarUpload')?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <FiCamera />
                    {isUploadingAvatar ? 'Envoi...' : 'Changer la photo'}
                  </button>
                  <button
                    type="button"
                    className="delete-avatar-btn"
                    onClick={async () => {
                      setIsRemovingAvatar(true);
                      try {
                        await dispatch(removeAvatar()).unwrap();
                      } catch (err) {
                        console.error('Remove avatar error:', err);
                      } finally {
                        setIsRemovingAvatar(false);
                      }
                    }}
                    disabled={isRemovingAvatar}
                  >
                    {isRemovingAvatar ? 'Suppression...' : 'Supprimer la photo'}
                  </button>
                </div>
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
                <button onClick={handleSave} className="save-btn">
                  <FiSave />
                  Sauvegarder
                </button>
                <button onClick={handleCancel} className="cancel-btn">
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
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
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
                  <span>{user?.address || 'Non renseignée'}</span>
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
                  <span>{user?.city || 'Non renseignée'}</span>
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
                  <span>{user?.postalCode || 'Non renseigné'}</span>
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
                  <span>{user?.country || 'France'}</span>
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