import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';

// Reducers
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productsReducer from './slices/productsSlice';
import ordersReducer from './slices/ordersSlice';
import adminReducer from './slices/adminSlice';
import notificationsReducer from './slices/notificationsSlice';
import themeReducer from './slices/themeSlice';

// Configuration de persistance
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'cart', 'theme'] // Seuls auth, cart et theme seront persistés
};

// Combinaison des reducers
const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  products: productsReducer,
  orders: ordersReducer,
  admin: adminReducer,
  notifications: notificationsReducer,
  theme: themeReducer
});

// Reducer persisté
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configuration du store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

// Persistor pour Redux Persist
export const persistor = persistStore(store);

export default store;