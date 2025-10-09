import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FiUsers, 
  FiShoppingBag, 
  FiDollarSign, 
  FiTrendingUp,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiPackage,
  FiShoppingCart,
  FiTrendingDown,
  FiArrowRight
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { fetchDashboardStats } from '../../store/slices/adminSlice';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector(state => state.admin.stats);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const statCards = stats?.overview ? [
    {
      title: 'Utilisateurs',
      value: stats.overview.totalUsers,
      icon: FiUsers,
      color: 'blue',
      change: `+${stats.overview.newUsersThisMonth} ce mois`,
      trend: 'up'
    },
    {
      title: 'Produits',
      value: stats.overview.totalProducts,
      icon: FiPackage,
      color: 'green',
      change: `${stats.overview.activeProducts} actifs`,
      trend: 'up'
    },
    {
      title: 'Commandes',
      value: stats.overview.totalOrders,
      icon: FiShoppingBag,
      color: 'purple',
      change: `+${stats.overview.ordersThisMonth} ce mois`,
      trend: 'up'
    },
    {
      title: 'Revenus',
      value: `${stats.overview.totalRevenue.toLocaleString('fr-FR')} €`,
      icon: FiDollarSign,
      color: 'orange',
      change: `+${stats.overview.monthlyRevenue.toLocaleString('fr-FR')} € ce mois`,
      trend: 'up'
    }
  ] : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'pending': return 'info';
      case 'shipped': return 'primary';
      default: return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'processing': return 'En cours';
      case 'pending': return 'En attente';
      case 'shipped': return 'Expédiée';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-state">
          <p>Erreur lors du chargement des données: {error}</p>
          <button onClick={() => dispatch(fetchDashboardStats())}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Aperçu de votre boutique CustomWear</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              className={`stat-card ${stat.color}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="stat-icon">
                <Icon />
              </div>
              <div className="stat-content">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
                <div className={`stat-change ${stat.trend}`}>
                  {stat.trend === 'up' ? <FiTrendingUp /> : <FiTrendingDown />}
                  <span>{stat.change}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="dashboard-content">
        {/* Recent Orders */}
        <motion.div
          className="dashboard-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <h2>Commandes Récentes</h2>
            <Link to="/admin/orders" className="view-all-btn">
              Voir tout <FiArrowRight />
            </Link>
          </div>
          <div className="orders-list">
            {stats?.recentOrders?.map((order) => (
              <div key={order._id} className="order-item">
                <div className="order-info">
                  <h4>{order.user?.firstName} {order.user?.lastName}</h4>
                  <p>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="order-amount">
                  {order.totalAmount.toLocaleString('fr-FR')} €
                </div>
                <div className={`order-status ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </div>
              </div>
            )) || <p>Aucune commande récente</p>}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          className="dashboard-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="card-header">
            <h2>Produits Populaires</h2>
            <Link to="/admin/products" className="view-all-btn">
              Voir tout <FiArrowRight />
            </Link>
          </div>
          <div className="products-list">
            {stats?.topProducts?.map((product, index) => (
              <div key={product._id} className="product-item">
                <div className="product-rank">#{index + 1}</div>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p>{product.totalSold} ventes</p>
                </div>
                <div className="product-revenue">
                  {product.revenue.toLocaleString('fr-FR')} €
                </div>
              </div>
            )) || <p>Aucun produit populaire</p>}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        className="quick-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2>Actions Rapides</h2>
        <div className="actions-grid">
          <Link to="/admin/products/new" className="action-card">
            <FiPackage />
            <span>Ajouter un Produit</span>
          </Link>
          <Link to="/admin/orders" className="action-card">
            <FiEye />
            <span>Voir les Commandes</span>
          </Link>
          <Link to="/admin/users" className="action-card">
            <FiUsers />
            <span>Gérer les Utilisateurs</span>
          </Link>
          <Link to="/admin/analytics" className="action-card">
            <FiTrendingUp />
            <span>Voir les Statistiques</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;