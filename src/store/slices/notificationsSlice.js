import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';

// Transforme les stats admin en notifications lisibles
const buildNotificationsFromStats = (stats) => {
  const notifications = [];
  try {
    const products = stats?.products || {};
    const orders = stats?.orders || {};
    const users = stats?.users || {};
    const recentOrders = stats?.recentOrders || [];

    if (products.lowStockProducts > 0) {
      notifications.push({
        id: `low-stock-${Date.now()}`,
        type: 'warning',
        title: 'Stock faible',
        message: `${products.lowStockProducts} produit(s) avec stock < 10`,
        ts: Date.now(),
        read: false
      });
    }

    if (orders.pendingOrders > 0) {
      notifications.push({
        id: `pending-orders-${Date.now()}`,
        type: 'info',
        title: 'Commandes en attente',
        message: `${orders.pendingOrders} commande(s) nécessitent une action`,
        ts: Date.now(),
        read: false
      });
    }

    if (users.newUsersThisMonth > 0) {
      notifications.push({
        id: `new-users-${Date.now()}`,
        type: 'success',
        title: 'Nouveaux utilisateurs',
        message: `${users.newUsersThisMonth} inscription(s) ce mois-ci`,
        ts: Date.now(),
        read: false
      });
    }

    recentOrders.slice(0, 3).forEach((order) => {
      notifications.push({
        id: `order-${order._id}`,
        type: 'success',
        title: 'Nouvelle commande',
        message: `Commande #${order.orderNumber || order._id?.slice(-6)} de ${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
        ts: new Date(order.createdAt).getTime(),
        read: false
      });
    });
  } catch (_) {}
  return notifications;
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getDashboardStats();
      const data = response?.data?.data || response?.data;
      const generated = buildNotificationsFromStats(data || {});
      return generated;
    } catch (error) {
      // Fallback: aucune notif serveur disponible, renvoyer un set minimal
      return [
        {
          id: `welcome-${Date.now()}`,
          type: 'info',
          title: 'Bienvenue',
          message: 'Le système de notifications est actif.',
          ts: Date.now(),
          read: false
        }
      ];
    }
  }
);

const initialState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const payload = action.payload || {};
      const id = payload.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item = {
        id,
        type: payload.type || 'info',
        title: payload.title || 'Notification',
        message: payload.message || '',
        ts: payload.ts || Date.now(),
        read: false
      };
      state.items.unshift(item);
      state.unreadCount += 1;
    },
    markAllRead: (state) => {
      state.items = state.items.map(n => ({ ...n, read: true }));
      state.unreadCount = 0;
    },
    markRead: (state, action) => {
      const id = action.payload;
      const idx = state.items.findIndex(n => n.id === id);
      if (idx !== -1 && !state.items[idx].read) {
        state.items[idx].read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    clearAll: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.error = null;
    },
    setNotifications: (state, action) => {
      const items = action.payload || [];
      state.items = items;
      state.unreadCount = items.filter(n => !n.read).length;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const items = action.payload || [];
        // Merge non-dupliqué par id
        const existingIds = new Set(state.items.map(n => n.id));
        const merged = [
          ...items.filter(n => !existingIds.has(n.id)),
          ...state.items
        ];
        state.items = merged.sort((a, b) => (b.ts || 0) - (a.ts || 0));
        state.unreadCount = merged.filter(n => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Impossible de charger les notifications';
      });
  }
});

export const { addNotification, markAllRead, markRead, clearAll, setNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;