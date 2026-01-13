import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUsers, FiShoppingBag, FiDollarSign, FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';
import { fetchDashboardStats } from '../../store/slices/adminSlice';
import { Card } from '../../components/ui/card';

const KPI = ({ icon: Icon, label, value, trend, trendLabel }) => {
  const isPositive = trend >= 0;
  
  return (
    <Card className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
          <Icon size={24} />
        </div>
        {trend != null && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <FiTrendingUp /> : <FiTrendingDown />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-slate-500 text-sm font-medium">{label}</h3>
        <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
        {trendLabel && <p className="text-xs text-slate-400 mt-1">{trendLabel}</p>}
      </div>
    </Card>
  );
};

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
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-center m-4">
        {typeof error === 'string' ? error : 'Erreur lors du chargement des statistiques'}
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <FiActivity className="text-blue-600" />
          Tableau de Bord
        </h1>
        <p className="text-slate-500 mt-1">Aperçu des performances de votre boutique</p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <motion.div variants={itemVariants}>
          <KPI 
            icon={FiUsers} 
            label="Utilisateurs" 
            value={stats?.totals?.users ?? 0} 
            trend={stats?.trends?.users}
            trendLabel="vs mois dernier"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPI 
            icon={FiShoppingBag} 
            label="Commandes" 
            value={stats?.totals?.orders ?? 0} 
            trend={stats?.trends?.orders}
            trendLabel="vs mois dernier"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPI 
            icon={FiDollarSign} 
            label="Revenus" 
            value={formatCurrency(stats?.totals?.revenue ?? 0)} 
            trend={stats?.trends?.revenue}
            trendLabel="vs mois dernier"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KPI 
            icon={FiTrendingUp} 
            label="Taux de conversion" 
            value={(stats?.totals?.conversionRate ?? 0) + '%'} 
            trend={stats?.trends?.conversionRate}
            trendLabel="vs mois dernier"
          />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full bg-white border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Commandes récentes</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Voir tout</button>
            </div>
            <div className="divide-y divide-slate-100">
              {(stats?.recentOrders || []).slice(0, 8).map((o) => (
                <div key={o._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                      {o.user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{o.user?.firstName} {o.user?.lastName}</div>
                      <div className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  <div className="font-semibold text-slate-900">{formatCurrency(o.totalAmount)}</div>
                </div>
              ))}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <div className="p-8 text-center text-slate-500">Aucune commande récente</div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full bg-white border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Produits populaires</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Voir rapport</button>
            </div>
            <div className="divide-y divide-slate-100">
              {(stats?.topProducts || []).slice(0, 8).map((p, index) => (
                <div key={p._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center font-bold text-slate-400 bg-slate-50 rounded-md">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.sales ?? 0} ventes</div>
                    </div>
                  </div>
                  <div className="font-semibold text-slate-900">{formatCurrency(p.revenue ?? 0)}</div>
                </div>
              ))}
              {(!stats?.topProducts || stats.topProducts.length === 0) && (
                <div className="p-8 text-center text-slate-500">Aucune donnée produit</div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
