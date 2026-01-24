import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Thunk pour synchroniser le thème avec le backend
export const syncThemeWithUser = createAsyncThunk(
  'theme/syncWithUser',
  async (theme, { rejectWithValue }) => {
    try {
      // Si l'API existe, on l'appelle. Sinon on simule le succès.
      // const response = await api.patch('/users/theme', { theme });
      // return response.data.data.theme;
      return theme;
    } catch (error) {
      // Silencieux si l'API n'est pas encore prête
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour du thème');
    }
  }
);

const getInitialTheme = () => {
  // 1. Vérifier localStorage
  const localTheme = localStorage.getItem('app-theme');
  if (localTheme && ['light', 'dark', 'deep-blue'].includes(localTheme)) {
    return localTheme;
  }
  
  // 2. Vérifier préférence système
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  // 3. Fallback
  return 'light';
};

const initialState = {
  theme: getInitialTheme(),
  isLoading: false,
  error: null
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      const newTheme = action.payload;
      if (['light', 'dark', 'deep-blue'].includes(newTheme)) {
        state.theme = newTheme;
        localStorage.setItem('app-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    },
    // Action pour mettre à jour le thème depuis la BDD (lors du login/loadUser)
    setThemeFromUser: (state, action) => {
      if (['light', 'dark', 'deep-blue'].includes(action.payload)) {
        state.theme = action.payload;
        localStorage.setItem('app-theme', action.payload);
        document.documentElement.setAttribute('data-theme', action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncThemeWithUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(syncThemeWithUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Le thème est déjà mis à jour localement via setTheme
      })
      .addCase(syncThemeWithUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setTheme, setThemeFromUser } = themeSlice.actions;
export default themeSlice.reducer;
