import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';
import { mockStats, mockProducts, mockOrders, mockUsers } from '../../data/mockData';

// Actions asynchrones pour les produits admin
export const fetchAllProducts = createAsyncThunk(
  'admin/fetchAllProducts',
  async (params = {}, { rejectWithValue }) => {
    const { page = 1, limit = 10, search = '', category = '' } = params;
    try {
      const response = await adminAPI.getAllProducts({ page, limit, search, category });
      return response.data;
    } catch (error) {
      // En cas d'erreur API, utiliser les données de test
      console.warn('API non disponible, utilisation des données de test');
      return {
        success: true,
        data: {
          products: mockProducts,
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalCount: mockProducts.length,
            hasNext: false,
            hasPrev: false
          }
        }
      };
    }
  }
);

export const createProduct = createAsyncThunk(
  'admin/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await adminAPI.createProduct(productData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création du produit');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'admin/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.updateProduct(id, productData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour du produit');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      await adminAPI.deleteProduct(productId);
      return productId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la suppression du produit');
    }
  }
);

// Actions asynchrones pour les commandes admin
export const fetchAllOrders = createAsyncThunk(
  'admin/fetchAllOrders',
  async (params = {}, { rejectWithValue }) => {
    const { page = 1, limit = 10, status = '', search = '' } = params;
    try {
      const response = await adminAPI.getAllOrders({ page, limit, status, search });
      return response.data;
    } catch (error) {
      // En cas d'erreur API, utiliser les données de test
      console.warn('API non disponible, utilisation des données de test');
      return {
        success: true,
        data: {
          orders: mockOrders,
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalCount: mockOrders.length,
            hasNext: false,
            hasPrev: false
          }
        }
      };
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'admin/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.updateOrderStatus(id, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  }
);

// Actions asynchrones pour les utilisateurs admin
export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async (params = {}, { rejectWithValue }) => {
    const { page = 1, limit = 10, search = '', role = '' } = params;
    try {
      const response = await adminAPI.getAllUsers({ page, limit, search, role });
      return response.data;
    } catch (error) {
      // En cas d'erreur API, utiliser les données de test
      console.warn('API non disponible, utilisation des données de test');
      return {
        success: true,
        data: {
          users: mockUsers,
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalCount: mockUsers.length,
            hasNext: false,
            hasPrev: false
          }
        }
      };
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'admin/updateUserStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.updateUserStatus(id, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour du statut utilisateur');
    }
  }
);

// Actions asynchrones pour les statistiques
export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getDashboardStats();
      return response.data;
    } catch (error) {
      // En cas d'erreur API, utiliser les données de test
      console.warn('API non disponible, utilisation des données de test');
      return {
        success: true,
        data: mockStats
      };
    }
  }
);

const initialState = {
  // Produits
  products: {
    items: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null
  },
  
  // Commandes
  orders: {
    items: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null
  },
  
  // Utilisateurs
  users: {
    items: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null
  },
  
  // Statistiques du dashboard
  stats: {
    data: null,
    loading: false,
    error: null
  },
  
  // États globaux
  loading: false,
  error: null
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.products.error = null;
      state.orders.error = null;
      state.users.error = null;
      state.stats.error = null;
    },
    setProductsPage: (state, action) => {
      state.products.currentPage = action.payload;
    },
    setOrdersPage: (state, action) => {
      state.orders.currentPage = action.payload;
    },
    setUsersPage: (state, action) => {
      state.users.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Produits
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.products.loading = true;
        state.products.error = null;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.products.loading = false;
        const data = action.payload.data || action.payload;
        state.products.items = data.products || [];
        
        // Gérer les deux structures possibles (API réelle vs données de test)
        if (data.pagination) {
          state.products.totalCount = data.pagination.totalCount;
          state.products.currentPage = data.pagination.currentPage;
          state.products.totalPages = data.pagination.totalPages;
        } else {
          state.products.totalCount = data.totalCount || data.products?.length || 0;
          state.products.currentPage = data.currentPage || 1;
          state.products.totalPages = data.totalPages || 1;
        }
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload;
      })
      
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        const createdProduct = action.payload?.data?.product || action.payload?.data;
        if (createdProduct) {
          state.products.items.unshift(createdProduct);
          state.products.totalCount += 1;
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProduct = action.payload?.data?.product || action.payload?.data;
        if (updatedProduct && updatedProduct._id) {
          const index = state.products.items.findIndex(p => p._id === updatedProduct._id);
          if (index !== -1) {
            state.products.items[index] = updatedProduct;
          }
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products.items = state.products.items.filter(p => p._id !== action.payload);
        state.products.totalCount -= 1;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Commandes
    builder
      .addCase(fetchAllOrders.pending, (state) => {
        state.orders.loading = true;
        state.orders.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.orders.loading = false;
        state.orders.items = action.payload.data.orders;
        state.orders.totalCount = action.payload.data.totalCount;
        state.orders.currentPage = action.payload.data.currentPage;
        state.orders.totalPages = action.payload.data.totalPages;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.orders.loading = false;
        state.orders.error = action.payload;
      })
      
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.items.findIndex(o => o._id === action.payload.data.order._id);
        if (index !== -1) {
          state.orders.items[index] = action.payload.data.order;
        }
      });

    // Utilisateurs
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.items = action.payload.data.users;
        state.users.totalCount = action.payload.data.totalCount;
        state.users.currentPage = action.payload.data.currentPage;
        state.users.totalPages = action.payload.data.totalPages;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload;
      })
      
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const index = state.users.items.findIndex(u => u._id === action.payload.data.user._id);
        if (index !== -1) {
          state.users.items[index] = action.payload.data.user;
        }
      });

    // Statistiques
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.stats.loading = true;
        state.stats.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.stats.loading = false;
        state.stats.data = action.payload.data;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.stats.loading = false;
        state.stats.error = action.payload;
      });
  }
});

export const { clearError, setProductsPage, setOrdersPage, setUsersPage } = adminSlice.actions;
export default adminSlice.reducer;