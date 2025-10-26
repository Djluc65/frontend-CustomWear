import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiEdit3,
  FiPackage,
  FiTruck,
  FiCheck,
  FiX,
  FiClock,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { 
  fetchAllOrders, 
  updateOrderStatus 
} from '../../store/slices/adminSlice';
import './AdminOrders.css';

const AdminOrders = () => {
  const dispatch = useDispatch();
  const { items: orders, loading, error } = useSelector(state => state.admin.orders);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const ordersPerPage = 10;

  // Données simulées - à remplacer par de vraies données
  const mockOrders = [
    {
      _id: '1',
      orderNumber: 'CMD-2024-001',
      customer: {
        name: 'Jean Dupont',
        email: 'jean.dupont@email.com'
      },
      items: [
        { name: 'T-shirt Custom', quantity: 2, price: 25.99 },
        { name: 'Hoodie Personnalisé', quantity: 1, price: 45.99 }
      ],
      total: 97.97,
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z',
      shippingAddress: {
        street: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France'
      }
    },
    {
      _id: '2',
      orderNumber: 'CMD-2024-002',
      customer: {
        name: 'Marie Martin',
        email: 'marie.martin@email.com'
      },
      items: [
        { name: 'Casquette Custom', quantity: 1, price: 19.99 }
      ],
      total: 19.99,
      status: 'processing',
      createdAt: '2024-01-14T14:20:00Z',
      shippingAddress: {
        street: '456 Avenue des Champs',
        city: 'Lyon',
        postalCode: '69000',
        country: 'France'
      }
    },
    {
      _id: '3',
      orderNumber: 'CMD-2024-003',
      customer: {
        name: 'Pierre Durand',
        email: 'pierre.durand@email.com'
      },
      items: [
        { name: 'Polo Personnalisé', quantity: 3, price: 35.99 }
      ],
      total: 107.97,
      status: 'shipped',
      createdAt: '2024-01-13T09:15:00Z',
      shippingAddress: {
        street: '789 Boulevard Saint-Germain',
        city: 'Marseille',
        postalCode: '13000',
        country: 'France'
      }
    }
  ];

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'processing', label: 'En traitement' },
    { value: 'shipped', label: 'Expédiée' },
    { value: 'delivered', label: 'Livrée' },
    { value: 'cancelled', label: 'Annulée' }
  ];

  useEffect(() => {
    // Charger les commandes via Redux
    dispatch(fetchAllOrders({ page: 1, limit: 50 }));
  }, [dispatch]);

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        label: 'En attente', 
        class: 'status-pending', 
        icon: FiClock,
        color: '#f59e0b'
      },
      processing: { 
        label: 'En traitement', 
        class: 'status-processing', 
        icon: FiPackage,
        color: '#3b82f6'
      },
      shipped: { 
        label: 'Expédiée', 
        class: 'status-shipped', 
        icon: FiTruck,
        color: '#8b5cf6'
      },
      delivered: { 
        label: 'Livrée', 
        class: 'status-delivered', 
        icon: FiCheck,
        color: '#10b981'
      },
      cancelled: { 
        label: 'Annulée', 
        class: 'status-cancelled', 
        icon: FiX,
        color: '#ef4444'
      }
    };
    return configs[status] || configs.pending;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await dispatch(updateOrderStatus({ 
        orderId, 
        status: newStatus 
      })).unwrap();
      dispatch(fetchAllOrders({ page: 1, limit: 50 }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-orders">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      {/* Header */}
      <div className="orders-header">
        <div className="header-left">
          <h1>Gestion des Commandes</h1>
          <p>{filteredOrders.length} commandes trouvées</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <FiDollarSign className="stat-icon" />
            <div>
              <span className="stat-value">
                {orders.reduce((sum, order) => sum + order.total, 0).toLocaleString('fr-FR')} €
              </span>
              <span className="stat-label">Chiffre d'affaires</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par numéro, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Client</th>
              <th>Date</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="order-info">
                    <div className="order-cell">
                      <div className="order-number">
                        <strong>{order.orderNumber || order._id}</strong>
                        <span className="items-count">
                          {order.items.length} article{order.items.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="customer-info">
                    <div className="customer-cell">
                      <FiUser className="customer-icon" />
                      <div>
                        <div className="customer-name">
                          {order.user?.firstName} {order.user?.lastName}
                        </div>
                        <div className="customer-email">{order.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="date-cell">
                    <FiCalendar className="date-icon" />
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="amount-cell">
                    <strong>{order.totalAmount?.toLocaleString('fr-FR')} €</strong>
                  </td>
                  <td className="status-cell">
                    <div className="status-container">
                      <span className={`status-badge ${statusConfig.class}`}>
                        <StatusIcon className="status-icon" />
                        {statusConfig.label}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="status-select"
                      >
                        {statusOptions.slice(1).map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleViewOrder(order)}
                        title="Voir les détails"
                      >
                        <FiEye />
                      </button>
                      <button
                        className="action-btn edit-btn"
                        title="Modifie"
                      >
                        <FiEdit3 />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="empty-state">
            <FiPackage className="empty-icon" />
            <h3>Aucune commande trouvée</h3>
            <p>Aucune commande ne correspond à vos critères de recherche</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowModal(false)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
};

// Composant Modal pour les détails de commande
const OrderDetailsModal = ({ order, onClose, onStatusChange }) => {
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        label: 'En attente', 
        class: 'status-pending', 
        icon: FiClock,
        color: '#f59e0b'
      },
      processing: { 
        label: 'En traitement', 
        class: 'status-processing', 
        icon: FiPackage,
        color: '#3b82f6'
      },
      shipped: { 
        label: 'Expédiée', 
        class: 'status-shipped', 
        icon: FiTruck,
        color: '#8b5cf6'
      },
      delivered: { 
        label: 'Livrée', 
        class: 'status-delivered', 
        icon: FiCheck,
        color: '#10b981'
      },
      cancelled: { 
        label: 'Annulée', 
        class: 'status-cancelled', 
        icon: FiX,
        color: '#ef4444'
      }
    };
    return configs[status] || configs.pending;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Détails de la commande {order.orderNumber}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="order-details">
          {/* Status and Date */}
          <div className="order-summary">
            <div className="status-section">
              <span className={`status-badge large ${statusConfig.class}`}>
                <StatusIcon className="status-icon" />
                {statusConfig.label}
              </span>
              <select
                value={order.status}
                onChange={(e) => onStatusChange(order._id, e.target.value)}
                className="status-select"
              >
                <option value="pending">En attente</option>
                <option value="processing">En traitement</option>
                <option value="shipped">Expédiée</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
            <div className="order-date">
              <FiCalendar className="date-icon" />
              Commandé le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Customer Info */}
          <div className="section">
            <h3>Informations client</h3>
            <div className="customer-details">
              <div className="detail-row">
                <span className="label">Nom :</span>
                <span className="value">{order.customer.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Email :</span>
                <span className="value">{order.customer.email}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="section">
            <h3>Adresse de livraison</h3>
            <div className="address-details">
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="section">
            <h3>Articles commandés</h3>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">Quantité: {item.quantity}</span>
                  </div>
                  <div className="item-price">
                    {(item.price * item.quantity).toLocaleString('fr-FR')} €
                  </div>
                </div>
              ))}
            </div>
            <div className="order-total">
              <strong>Total: {order.total.toLocaleString('fr-FR')} €</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;