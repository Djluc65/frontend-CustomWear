import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUsers, FiShoppingBag, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { fetchDashboardStats } from '../../store/slices/adminSlice';
import './AdminAnalytics.css';

const KPI = ({ icon: Icon, label, value, trend }) => (
  <motion.div className="kpi-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <div className="kpi-icon"><Icon /></div>
    <div className="kpi-content">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {trend != null && (
        <div className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
          <FiTrendingUp /> {Math.abs(trend)}%
        </div>
      )}
    </div>
  </motion.div>
);

const AdminAnalytics = () => {
  const dispatch = useDispatch();
  const { data: stats, loading, error } = useSelector(state => state.admin.stats);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const formatCurrency = (n) => {
    if (n == null) return '—';
    return Number(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  if (loading) {
    return <div className="analytics-loading">Chargement des statistiques…</div>;
  }

  if (error) {
    return <div className="analytics-error">{error}</div>;
  }

  return (
    <div className="admin-analytics">
      <h2>Statistiques</h2>

      <div className="kpi-grid">
        <KPI icon={FiUsers} label="Utilisateurs" value={stats?.totals?.users ?? 0} trend={stats?.trends?.users} />
        <KPI icon={FiShoppingBag} label="Commandes" value={stats?.totals?.orders ?? 0} trend={stats?.trends?.orders} />
        <KPI icon={FiDollarSign} label="Revenus" value={formatCurrency(stats?.totals?.revenue ?? 0)} trend={stats?.trends?.revenue} />
        <KPI icon={FiTrendingUp} label="Conversion" value={(stats?.totals?.conversionRate ?? 0) + '%'} trend={stats?.trends?.conversionRate} />
      </div>

      <div className="analytics-panels">
        <motion.div className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="panel-header"><h3>Commandes récentes</h3></div>
          <div className="panel-body list">
            {(stats?.recentOrders || []).slice(0, 8).map((o) => (
              <div className="list-item" key={o._id}>
                <div className="list-left">
                  <div className="title">{o.user?.firstName} {o.user?.lastName}</div>
                  <div className="subtitle">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="list-right">{formatCurrency(o.totalAmount)}</div>
              </div>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && <div className="empty">Aucune donnée</div>}
          </div>
        </motion.div>

        <motion.div className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="panel-header"><h3>Produits populaires</h3></div>
          <div className="panel-body list">
            {(stats?.topProducts || []).slice(0, 8).map((p) => (
              <div className="list-item" key={p._id}>
                <div className="list-left">
                  <div className="title">{p.name}</div>
                  <div className="subtitle">Ventes: {p.sales ?? 0}</div>
                </div>
                <div className="list-right">{formatCurrency(p.revenue ?? 0)}</div>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && <div className="empty">Aucune donnée</div>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAnalytics;