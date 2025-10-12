import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Configuration axios (alignée sur le backend port 5001)
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001') + '/api';

// Actions asynchrones
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('[authSlice] loginUser request', { email });
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const data = response.data?.data || response.data;
      console.log('[authSlice] loginUser response', data);
      // Stocker le token dans localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data;
    } catch (error) {
      console.error('[authSlice] loginUser error', error?.response?.data || error);
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de connexion'
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ firstName, lastName, email, password, confirmPassword }, { rejectWithValue }) => {
    try {
      console.log('[authSlice] registerUser request', { email, firstName, lastName });
      const response = await axios.post(`${API_URL}/auth/register`, {
        firstName,
        lastName,
        email,
        password,
        confirmPassword
      });
      const data = response.data?.data || response.data;
      console.log('[authSlice] registerUser response', data);
      // Stocker le token dans localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data;
    } catch (error) {
      console.error('[authSlice] registerUser error', error?.response?.data || error);
      const firstValidationError = error.response?.data?.errors?.[0]?.message;
      const message = firstValidationError || error.response?.data?.message || 'Erreur d\'inscription';
      return rejectWithValue(message);
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (credential, { rejectWithValue }) => {
    try {
      console.log('[authSlice] googleLogin request', { hasCredential: Boolean(credential) });
      const response = await axios.post(`${API_URL}/auth/google`, { credential });
      const data = response.data?.data || response.data;
      console.log('[authSlice] googleLogin response', data);
      // Stocker le token dans localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data;
    } catch (error) {
      console.error('[authSlice] googleLogin error', error?.response?.data || error);
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de connexion Google'
      );
    }
  }
);

export const facebookLogin = createAsyncThunk(
  'auth/facebookLogin',
  async (accessToken, { rejectWithValue }) => {
    try {
      console.log('[authSlice] facebookLogin request', { hasAccessToken: Boolean(accessToken) });
      const response = await axios.post(`${API_URL}/auth/facebook`, { accessToken });
      const data = response.data?.data || response.data;
      console.log('[authSlice] facebookLogin response', data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data;
    } catch (error) {
      console.error('[authSlice] facebookLogin error', error?.response?.data || error);
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de connexion Facebook'
      );
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      console.log('[authSlice] loadUser start', { hasToken: Boolean(token) });
      if (!token) {
        return rejectWithValue('Aucun token trouvé');
      }
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = response.data?.data || response.data;
      console.log('[authSlice] loadUser response', data);
      // Synchroniser user en localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      console.error('[authSlice] loadUser error', error?.response?.data || error);
      localStorage.removeItem('token');
      return rejectWithValue(
        error.response?.data?.message || 'Token invalide'
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(`${API_URL}/users/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de mise à jour du profil'
      );
    }
  }
);

export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async ({ pseudo, email, password, role }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/admin/login`, {
        pseudo,
        email,
        password,
        role
      });
      
      // Stocker le token dans localStorage
      localStorage.setItem('token', response.data.data.token);
      
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de connexion admin'
      );
    }
  }
);

// État initial
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: false,
  error: null
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    loginSuccess: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || state.user;
        state.token = action.payload.token || state.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || state.user;
        state.token = action.payload.token || state.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      // Google Login
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || state.user;
        state.token = action.payload.token || state.token;
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      // Facebook Login
      .addCase(facebookLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(facebookLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || state.user;
        state.token = action.payload.token || state.token;
        state.error = null;
      })
      .addCase(facebookLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || state.user;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Admin Login
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError, loginSuccess } = authSlice.actions;
export default authSlice.reducer;