import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Configuration axios (normalisation de l'URL de base)
const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

// Actions asynchrones
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('[authSlice] loginUser request', { email });
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      // Extraction des tokens depuis les headers ou le body
      const headerToken = response.headers['authorization']?.split(' ')[1];
      const headerRefreshToken = response.headers['x-refresh-token'];
      
      const data = response.data?.data || response.data;
      
      // Priorité aux headers
      if (headerToken) data.token = headerToken;
      if (headerRefreshToken) data.refreshToken = headerRefreshToken;
      
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
      
      // Extraction des tokens depuis les headers ou le body
      const headerToken = response.headers['authorization']?.split(' ')[1];
      const headerRefreshToken = response.headers['x-refresh-token'];
      
      const data = response.data?.data || response.data;
      
      // Priorité aux headers
      if (headerToken) data.token = headerToken;
      if (headerRefreshToken) data.refreshToken = headerRefreshToken;

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
      // Envoyer le token Google au backend
      const response = await axios.post(`${API_URL}/auth/google`, { credential });
      
      // Extraction des tokens depuis les headers ou le body
      const headerToken = response.headers['authorization']?.split(' ')[1];
      const headerRefreshToken = response.headers['x-refresh-token'];
      
      const data = response.data?.data || response.data;
      
      // Priorité aux headers
      if (headerToken) data.token = headerToken;
      if (headerRefreshToken) data.refreshToken = headerRefreshToken;

      // Stocker le token dans localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data;
    } catch (error) {
      const firstValidationError = error.response?.data?.errors?.[0]?.message;
      const message = firstValidationError || error.response?.data?.message || 'Erreur de connexion Google';
      return rejectWithValue(message);
    }
  }
);

export const facebookLogin = createAsyncThunk(
  'auth/facebookLogin',
  async (accessToken, { rejectWithValue }) => {
    try {
      // Envoyer le token Facebook au backend
      const response = await axios.post(`${API_URL}/auth/facebook`, { accessToken });
      
      // Extraction des tokens depuis les headers ou le body
      const headerToken = response.headers['authorization']?.split(' ')[1];
      const headerRefreshToken = response.headers['x-refresh-token'];
      
      const data = response.data?.data || response.data;
      
      // Priorité aux headers
      if (headerToken) data.token = headerToken;
      if (headerRefreshToken) data.refreshToken = headerRefreshToken;

      // Stocker le token dans localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return data;
    } catch (error) {
      const firstValidationError = error.response?.data?.errors?.[0]?.message;
      const message = firstValidationError || error.response?.data?.message || 'Erreur de connexion Facebook';
      return rejectWithValue(message);
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
      // Ne pas envoyer les valeurs vides au backend
      const payload = Object.fromEntries(
        Object.entries(profileData).filter(([key, value]) => value !== '' && value !== null && value !== undefined)
      );
      const response = await axios.put(`${API_URL}/users/profile`, payload, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      });
      const data = response.data?.data || response.data;
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de mise à jour du profil'
      );
    }
  }
);

// Upload de l'avatar utilisateur
export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (file, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await axios.put(`${API_URL}/users/profile/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      const data = response.data?.data || response.data;
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de l\'upload de l\'avatar'
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

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  isAuthenticated: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
    },
    setTokens: (state, action) => {
      if (action.payload.token) {
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      }
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.isAuthenticated = true;
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
        state.token = action.payload.token;
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
        }
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
        }
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Google Login
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
        }
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Facebook Login
      .addCase(facebookLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(facebookLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
        }
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(facebookLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
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
        try {
          if (action.payload.user) {
            localStorage.setItem('user', JSON.stringify(action.payload.user));
          }
        } catch (_) {}
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Upload Avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user || state.user;
        state.error = null;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
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
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError, loginSuccess, setTokens } = authSlice.actions;
export default authSlice.reducer;