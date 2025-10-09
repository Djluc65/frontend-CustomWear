import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiUser,
  FiMail,
  FiCalendar,
  FiShoppingBag,
  FiDollarSign,
  FiUserPlus,
  FiShield,
  FiUsers,
  FiX,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { 
  fetchAllUsers, 
  updateUserStatus 
} from '../../store/slices/adminSlice';
import './AdminUsers.css';

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { items: users, loading, error } = useSelector(state => state.admin.users);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const usersPerPage = 10;

  // Données simulées - à remplacer par de vraies données
  const mockUsers = [
    {
      _id: '1',
      name: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      role: 'customer',
      createdAt: '2024-01-10T10:30:00Z',
      lastLogin: '2024-01-15T14:20:00Z',
      orders: 5,
      totalSpent: 245.50,
      status: 'active',
      phone: '+33 1 23 45 67 89',
      address: {
        street: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France'
      }
    },
    {
      _id: '2',
      name: 'Marie Martin',
      email: 'marie.martin@email.com',
      role: 'customer',
      createdAt: '2024-01-08T09:15:00Z',
      lastLogin: '2024-01-14T16:45:00Z',
      orders: 12,
      totalSpent: 567.80,
      status: 'active',
      phone: '+33 2 34 56 78 90',
      address: {
        street: '456 Avenue des Champs',
        city: 'Lyon',
        postalCode: '69000',
        country: 'France'
      }
    },
    {
      _id: '3',
      name: 'Pierre Durand',
      email: 'pierre.durand@email.com',
      role: 'admin',
      createdAt: '2023-12-01T08:00:00Z',
      lastLogin: '2024-01-15T18:30:00Z',
      orders: 0,
      totalSpent: 0,
      status: 'active',
      phone: '+33 3 45 67 89 01',
      address: {
        street: '789 Boulevard Saint-Germain',
        city: 'Marseille',
        postalCode: '13000',
        country: 'France'
      }
    },
    {
      _id: '4',
      name: 'Sophie Leroy',
      email: 'sophie.leroy@email.com',
      role: 'customer',
      createdAt: '2024-01-12T11:20:00Z',
      lastLogin: '2024-01-13T10:15:00Z',
      orders: 3,
      totalSpent: 89.99,
      status: 'inactive',
      phone: '+33 4 56 78 90 12',
      address: {
        street: '321 Rue de Rivoli',
        city: 'Nice',
        postalCode: '06000',
        country: 'France'
      }
    }
  ];

  const roleOptions = [
    { value: '', label: 'Tous les rôles' },
    { value: 'customer', label: 'Clients' },
    { value: 'admin', label: 'Administrateurs' }
  ];

  useEffect(() => {
    dispatch(fetchAllUsers({ page: 1, limit: 50 }));
  }, [dispatch]);

  const getRoleConfig = (role) => {
    const configs = {
      customer: { 
        label: 'Client', 
        class: 'role-customer', 
        icon: FiUser,
        color: '#3b82f6'
      },
      admin: { 
        label: 'Admin', 
        class: 'role-admin', 
        icon: FiShield,
        color: '#ef4444'
      }
    };
    return configs[role] || configs.customer;
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: { 
        label: 'Actif', 
        class: 'status-active'
      },
      inactive: { 
        label: 'Inactif', 
        class: 'status-inactive'
      }
    };
    return configs[status] || configs.active;
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      console.warn('Suppression utilisateur non implémentée côté API. Rafraîchissement de la liste.');
      // TODO: implémenter deleteUser thunk côté adminSlice puis rafraîchir
      dispatch(fetchAllUsers({ page: 1, limit: usersPerPage }));
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await dispatch(updateUserStatus({ 
        userId, 
        status: newStatus 
      })).unwrap();
      dispatch(fetchAllUsers({ page: 1, limit: 50 }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const filteredUsers = (users || mockUsers).filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || !roleFilter || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || !statusFilter || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const totalCustomers = users.filter(user => user.role === 'customer').length;
  const totalRevenue = users.reduce((sum, user) => sum + user.totalSpent, 0);

  if (loading) {
    return (
      <div className="admin-users">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users">
      {/* Header */}
      <div className="users-header">
        <div className="header-left">
          <h1>Gestion des Utilisateurs</h1>
          <p>{filteredUsers.length} utilisateurs trouvés</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <FiUsers className="stat-icon customers" />
            <div>
              <span className="stat-value">{totalCustomers}</span>
              <span className="stat-label">Clients</span>
            </div>
          </div>
          <div className="stat-card">
            <FiDollarSign className="stat-icon revenue" />
            <div>
              <span className="stat-value">{totalRevenue.toLocaleString('fr-FR')} €</span>
              <span className="stat-label">Chiffre d'affaires</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="users-filters">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="role-filter"
          >
            {roleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button className="add-user-btn">
          <FiUserPlus />
          Ajouter un Utilisateur
        </button>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Date d'inscription</th>
              <th>Dernière connexion</th>
              <th>Commandes</th>
              <th>Total dépensé</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const roleConfig = getRoleConfig(user.role);
              const statusConfig = getStatusConfig(user.status);
              const RoleIcon = roleConfig.icon;
              
              return (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="user-info">
                    <div className="user-cell">
                      <div className="user-avatar">
                        <FiUser />
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="role-cell">
                    <span className={`role-badge ${roleConfig.class}`}>
                      <RoleIcon className="role-icon" />
                      {roleConfig.label}
                    </span>
                  </td>
                  <td className="date-cell">
                    <FiCalendar className="date-icon" />
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="date-cell">
                    <FiCalendar className="date-icon" />
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="orders-cell">
                    <div className="orders-info">
                      <FiShoppingBag className="orders-icon" />
                      <span>{user.orders}</span>
                    </div>
                  </td>
                  <td className="spent-cell">
                    {user.totalSpent.toLocaleString('fr-FR')} €
                  </td>
                  <td className="status-cell">
                    <div className="status-container">
                      <span className={`status-badge ${statusConfig.class}`}>
                        {statusConfig.label}
                      </span>
                      <select
                        value={user.status}
                        onChange={(e) => handleStatusChange(user._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </select>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleViewUser(user)}
                        title="Voir les détails"
                      >
                        <FiEye />
                      </button>
                      <button
                        className="action-btn edit-btn"
                        title="Modifier"
                      >
                        <FiEdit3 />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteUser(user._id)}
                        title="Supprimer"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <FiUsers className="empty-icon" />
            <h3>Aucun utilisateur trouvé</h3>
            <p>Aucun utilisateur ne correspond à vos critères de recherche</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setShowModal(false)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

// Composant Modal pour les détails d'utilisateur
const UserDetailsModal = ({ user, onClose, onStatusChange }) => {
  const roleConfig = getRoleConfig(user.role);
  const statusConfig = getStatusConfig(user.status);
  const RoleIcon = roleConfig.icon;

  const getRoleConfig = (role) => {
    const configs = {
      customer: { 
        label: 'Client', 
        class: 'role-customer', 
        icon: FiUser,
        color: '#3b82f6'
      },
      admin: { 
        label: 'Admin', 
        class: 'role-admin', 
        icon: FiShield,
        color: '#ef4444'
      }
    };
    return configs[role] || configs.customer;
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: { 
        label: 'Actif', 
        class: 'status-active'
      },
      inactive: { 
        label: 'Inactif', 
        class: 'status-inactive'
      }
    };
    return configs[status] || configs.active;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Détails de l'utilisateur</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="user-details">
          {/* User Summary */}
          <div className="user-summary">
            <div className="user-avatar large">
              <FiUser />
            </div>
            <div className="user-info">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <div className="user-badges">
                <span className={`role-badge ${roleConfig.class}`}>
                  <RoleIcon className="role-icon" />
                  {roleConfig.label}
                </span>
                <span className={`status-badge ${statusConfig.class}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* User Stats */}
          <div className="user-stats">
            <div className="stat-item">
              <FiShoppingBag className="stat-icon" />
              <div>
                <span className="stat-number">{user.orders}</span>
                <span className="stat-label">Commandes</span>
              </div>
            </div>
            <div className="stat-item">
              <FiDollarSign className="stat-icon" />
              <div>
                <span className="stat-number">{user.totalSpent.toLocaleString('fr-FR')} €</span>
                <span className="stat-label">Total dépensé</span>
              </div>
            </div>
            <div className="stat-item">
              <FiCalendar className="stat-icon" />
              <div>
                <span className="stat-number">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <span className="stat-label">Membre depuis</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="section">
            <h4>Informations de contact</h4>
            <div className="contact-details">
              <div className="detail-row">
                <FiMail className="detail-icon" />
                <span className="label">Email :</span>
                <span className="value">{user.email}</span>
              </div>
              <div className="detail-row">
                <FiUser className="detail-icon" />
                <span className="label">Téléphone :</span>
                <span className="value">{user.phone}</span>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="section">
            <h4>Adresse</h4>
            <div className="address-details">
              <p>{user.address.street}</p>
              <p>{user.address.postalCode} {user.address.city}</p>
              <p>{user.address.country}</p>
            </div>
          </div>

          {/* Account Management */}
          <div className="section">
            <h4>Gestion du compte</h4>
            <div className="account-management">
              <div className="form-group">
                <label>Statut du compte :</label>
                <select
                  value={user.status}
                  onChange={(e) => onStatusChange(user._id, e.target.value)}
                  className="status-select"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
              <div className="detail-row">
                <span className="label">Dernière connexion :</span>
                <span className="value">
                  {new Date(user.lastLogin).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;