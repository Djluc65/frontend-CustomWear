import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Configuration axios
// Normalise l'URL de base pour garantir la présence de "/api" en production
const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

// Actions asynchrones
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de la création de la commande'
      );
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'orders/fetchUserOrders',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/orders/user`, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement des commandes'
      );
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Commande non trouvée'
      );
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.patch(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de la mise à jour du statut'
      );
    }
  }
);

// État initial
const initialState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  isCreating: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0
  }
};

// Slice
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isCreating = false;
        state.currentOrder = action.payload;
        state.orders.unshift(action.payload); // Ajouter en début de liste
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })
      
      // Fetch User Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Order By ID
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedOrder = action.payload;
        
        // Mettre à jour dans la liste des commandes
        const index = state.orders.findIndex(order => order._id === updatedOrder._id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        
        // Mettre à jour la commande courante si c'est la même
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
        
        state.error = null;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearCurrentOrder,
  clearError,
  setCurrentOrder
} = ordersSlice.actions;

export default ordersSlice.reducer;