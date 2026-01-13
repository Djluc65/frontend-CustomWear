import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FiUsers, 
  FiShoppingBag, 
  FiDollarSign, 
  FiTrendingUp,
  FiTrendingDown,
  FiArrowRight,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { fetchDashboardStats } from '../../store/slices/adminSlice';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

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
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      change: `+${stats.overview.newUsersThisMonth} ce mois`,
      trend: 'up'
    },
    {
      title: 'Produits',
      value: stats.overview.totalProducts,
      icon: FiPackage,
      color: 'text-green-600',
      bg: 'bg-green-100',
      change: `${stats.overview.activeProducts} actifs`,
      trend: 'up'
    },
    {
      title: 'Commandes',
      value: stats.overview.totalOrders,
      icon: FiShoppingBag,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      change: `+${stats.overview.ordersThisMonth} ce mois`,
      trend: 'up'
    },
    {
      title: 'Revenus',
      value: `${stats.overview.totalRevenue.toLocaleString('fr-FR')} €`,
      icon: FiDollarSign,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      change: `+${stats.overview.monthlyRevenue.toLocaleString('fr-FR')} € ce mois`,
      trend: 'up'
    }
  ] : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="mr-1" />;
      case 'processing': return <FiClock className="mr-1" />;
      case 'pending': return <FiClock className="mr-1" />;
      case 'shipped': return <FiTruck className="mr-1" />;
      case 'cancelled': return <FiXCircle className="mr-1" />;
      default: return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'processing': return 'En cours';
      case 'pending': return 'En attente';
      case 'shipped': return 'Expédiée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <p className="text-red-500 mb-4">Erreur lors du chargement des données: {error}</p>
        <Button onClick={() => dispatch(fetchDashboardStats())}>
          Réessayer
        </Button>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Aperçu de votre boutique CustomWear</p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card className="p-6 hover:shadow-md transition-shadow h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className={`flex items-center font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend === 'up' ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                  </span>
                  <span className="text-slate-500 ml-2">{stat.change}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Commandes Récentes</h2>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  Voir tout <FiArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {stats?.recentOrders?.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div key={order._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                        {order.user?.firstName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{order.user?.firstName} {order.user?.lastName}</h4>
                        <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="font-bold text-slate-900">
                        {order.totalAmount.toLocaleString('fr-FR')} €
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Aucune commande récente
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Top Products */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-1"
        >
          <Card className="h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Produits Populaires</h2>
              <Link to="/admin/products">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  Voir tout <FiArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {stats?.topProducts?.length > 0 ? (
                stats.topProducts.map((product, index) => (
                  <div key={product._id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className={`
                      flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-slate-200 text-slate-700' : 
                        index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'}
                    `}>
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-sm text-slate-500">{product.totalSold} ventes</p>
                    </div>
                    <div className="font-bold text-slate-900 whitespace-nowrap">
                      {product.revenue.toLocaleString('fr-FR')} €
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Aucun produit populaire
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;