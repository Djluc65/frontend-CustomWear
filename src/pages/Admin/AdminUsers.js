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
  FiChevronRight,
  FiRefreshCcw,
  FiPhone,
  FiMapPin
} from 'react-icons/fi';
import { fetchAllUsers, updateUserStatus } from '../../store/slices/adminSlice';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Card } from '../../components/ui/card';

const AdminUsers = () => {
  const dispatch = useDispatch();
  // Utiliser les vraies données si disponibles, sinon mock
  const { items: realUsers, loading, error } = useSelector(state => state.admin.users);
  
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
      createdAt: '2024-01-05T14:20:00Z',
      lastLogin: '2024-01-12T09:30:00Z',
      orders: 2,
      totalSpent: 89.90,
      status: 'inactive',
      phone: '+33 4 56 78 90 12',
      address: {
        street: '12 Rue de la République',
        city: 'Bordeaux',
        postalCode: '33000',
        country: 'France'
      }
    },
    {
      _id: '5',
      name: 'Lucas Bernard',
      email: 'lucas.bernard@email.com',
      role: 'customer',
      createdAt: '2024-01-12T16:45:00Z',
      lastLogin: '2024-01-15T11:15:00Z',
      orders: 8,
      totalSpent: 412.30,
      status: 'active',
      phone: '+33 5 67 89 01 23',
      address: {
        street: '34 Quai des Chartrons',
        city: 'Bordeaux',
        postalCode: '33000',
        country: 'France'
      }
    }
  ];

  const usersList = (realUsers && realUsers.length > 0) ? realUsers : mockUsers;

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const filteredUsers = usersList.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await dispatch(updateUserStatus({ userId, status: newStatus })).unwrap();
      // Mettre à jour localement si nécessaire (si on utilise mockUsers)
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'moderator': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-slate-100 text-slate-500';
      case 'banned': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <FiUsers className="text-blue-600" />
            Utilisateurs
          </h1>
          <p className="text-slate-500 mt-1">Gérez vos clients et administrateurs</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-600/20">
          <FiUserPlus size={20} />
          Ajouter un utilisateur
        </Button>
      </div>

      <Card className="p-4 mb-8 bg-white border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher (nom, email)..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 bg-slate-50 border-slate-200"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Select value={roleFilter} onChange={handleRoleFilter} className="min-w-[140px]">
              <option value="all">Tous rôles</option>
              <option value="customer">Client</option>
              <option value="admin">Admin</option>
              <option value="moderator">Modérateur</option>
            </Select>
            <Select value={statusFilter} onChange={handleStatusFilter} className="min-w-[140px]">
              <option value="all">Tous statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="banned">Banni</option>
            </Select>
            <Button variant="ghost" onClick={clearFilters} className="text-slate-500 hover:text-slate-700">
              <FiRefreshCcw />
            </Button>
          </div>
        </div>
      </Card>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Utilisateur</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Rôle</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Statut</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Commandes</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Dépenses</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Date d'inscription</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentUsers.map((user) => (
              <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{user.orders}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{user.totalSpent?.toFixed(2)} €</td>
                <td className="px-6 py-4 text-slate-500 text-sm">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleUserClick(user)} className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600">
                      <FiEye />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600">
                      <FiEdit3 />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-red-600">
                      <FiTrash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {currentUsers.length === 0 && (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Aucun utilisateur trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {currentUsers.map((user) => (
          <Card key={user._id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{user.name}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                   {user.role}
                 </span>
                 <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(user.status)}`}>
                   {user.status}
                 </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-slate-500 block mb-1">Commandes</span>
                <span className="font-medium text-slate-900">{user.orders}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Dépenses</span>
                <span className="font-medium text-slate-900">{user.totalSpent?.toFixed(2)} €</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block mb-1">Inscrit le</span>
                <span className="font-medium text-slate-900">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            <div className="flex gap-2 border-t pt-4 border-slate-100">
              <Button variant="outline" size="sm" onClick={() => handleUserClick(user)} className="flex-1 gap-2">
                <FiEye /> Détails
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <FiEdit3 /> Éditer
              </Button>
            </div>
          </Card>
        ))}
        {currentUsers.length === 0 && (
          <div className="text-center py-12 text-slate-500">Aucun utilisateur trouvé</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1}
            className="gap-2"
          >
            <FiChevronLeft /> Précédent
          </Button>
          <span className="text-sm text-slate-600 font-medium">Page {currentPage} / {totalPages}</span>
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
            disabled={currentPage === totalPages}
            className="gap-2"
          >
            Suivant <FiChevronRight />
          </Button>
        </div>
      )}

      {/* Modal Détails Utilisateur */}
      <AnimatePresence>
        {showModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 backdrop-blur-sm z-10">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FiUser className="text-blue-600" />
                  Détails Utilisateur
                </h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <FiX size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedUser.name}</h3>
                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                      <FiMail size={14} /> {selectedUser.email}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(selectedUser.role)}`}>
                        {selectedUser.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(selectedUser.status)}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4 space-y-3">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
                      <FiShoppingBag className="text-slate-400" /> Activité
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Commandes</span>
                        <span className="font-medium">{selectedUser.orders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total dépensé</span>
                        <span className="font-medium">{selectedUser.totalSpent?.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Dernière connexion</span>
                        <span className="font-medium">{new Date(selectedUser.lastLogin).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Inscription</span>
                        <span className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 space-y-3">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
                      <FiMapPin className="text-slate-400" /> Coordonnées
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <FiPhone className="mt-1 text-slate-400" />
                        <span>{selectedUser.phone || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <FiMapPin className="mt-1 text-slate-400" />
                        {selectedUser.address ? (
                          <div>
                            <div>{selectedUser.address.street}</div>
                            <div>{selectedUser.address.postalCode} {selectedUser.address.city}</div>
                            <div>{selectedUser.address.country}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Aucune adresse enregistrée</span>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>Fermer</Button>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">Contacter</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
