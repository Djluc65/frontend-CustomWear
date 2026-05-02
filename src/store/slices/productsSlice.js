import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

// Configuration axios
// Normalise l'URL de base pour éviter les 404 si REACT_APP_API_URL ne contient pas "/api"
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

// Actions asynchrones
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ 
    category = '', 
    search = '', 
    minPrice = '', 
    maxPrice = '', 
    featured = false,
    inStock = false,
    minRating = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    gender = '',
    color = '',
    size = '',
    page = 1, 
    limit = 12 
  } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (minPrice !== '' && minPrice != null) params.append('minPrice', minPrice);
      if (maxPrice !== '' && maxPrice != null) params.append('maxPrice', maxPrice);
      if (featured) params.append('featured', 'true');
      if (inStock) params.append('inStock', 'true');
      if (minRating !== '' && minRating != null) params.append('minRating', minRating);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (gender) params.append('gender', gender);
      if (color) params.append('color', color);
      if (size) params.append('size', size);
      params.append('page', page);
      params.append('limit', limit);
      
      const response = await axios.get(`${API_URL}/products?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement des produits'
      );
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/${productId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Produit non trouvé'
      );
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/featured`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement des produits vedettes'
      );
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/categories`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors du chargement des catégories'
      );
    }
  }
);

// État initial
const initialState = {
  products: [],
  featuredProducts: [],
  featuredProductsFetched: false,
  currentProduct: null,
  categories: [
    { id: 'tshirts', name: 'T-shirts', icon: '👕' },
    { id: 'vestes', name: 'Vestes', icon: '🧥' },
    { id: 'casquettes', name: 'Casquettes', icon: '🧢' },
    { id: 'vaisselle', name: 'Vaiselles', icon: '🍽️' }
  ],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false
  },
  filters: {
    category: '',
    search: '',
    priceRange: [0, 1000],
    sortBy: 'name'
  },
  isLoading: false,
  error: null
};

// Slice
const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = {
        category: '',
        search: '',
        priceRange: [0, 1000],
        sortBy: 'name'
      };
    },
    
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = action.payload?.data ?? action.payload ?? {};
        state.products = Array.isArray(data.products) ? data.products : [];
        state.pagination = data.pagination || state.pagination;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Product By ID
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = action.payload?.data ?? action.payload ?? {};
        state.currentProduct = data.product || null;
        state.error = null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Featured Products
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = action.payload?.data ?? action.payload ?? {};
        state.featuredProducts = Array.isArray(data.products) ? data.products : [];
        state.featuredProductsFetched = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.featuredProductsFetched = true;
        state.error = action.payload;
      })
      
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = action.payload?.data ?? action.payload ?? {};
        state.categories = Array.isArray(data.categories) ? data.categories : state.categories;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setFilters,
  clearFilters,
  setCurrentProduct,
  clearCurrentProduct,
  clearError
} = productsSlice.actions;

export default productsSlice.reducer;
