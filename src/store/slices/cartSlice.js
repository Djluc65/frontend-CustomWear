import { createSlice } from '@reduxjs/toolkit';

// État initial
const initialState = {
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
  // Champs de compatibilité pour Cart.js
  itemCount: 0,
  total: 0,
  isLoading: false,
  error: null
};

// Fonctions utilitaires
const calculateTotals = (items) => {
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  return { totalQuantity, totalAmount };
};

// Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      // Supporte différents formats de payload (ProductCard, ProductDetail)
      const payload = action.payload || {};
      const quantity = payload.quantity ?? 1;
      const customization = payload.customization ?? null;
      const variantId = payload.variantId;

      // Normaliser les champs du produit
      const product = payload.product || null;
      const productId = (product?.
        _id) ?? payload.productId ?? payload.id ?? payload._id;
      const name = product?.name ?? payload.name ?? 'Produit';
      const price = (product?.price?.sale ?? product?.price?.base ?? product?.price ?? payload.price ?? 0);
      const image = (product?.images?.[0]?.url ?? product?.images?.[0] ?? product?.image ?? payload.image ?? '/placeholder-product.jpg');
      const category = product?.category ?? payload.category ?? '';

      // Garde-fou si aucune id
      if (!productId) {
        state.error = 'Impossible d’ajouter au panier: identifiant produit manquant';
        return;
      }

      // Clé unique par produit + variante + personnalisation
      const baseKey = variantId ? `${productId}_${variantId}` : `${productId}`;
      const itemId = customization ? `${baseKey}_${JSON.stringify(customization)}` : baseKey;

      const existingItem = state.items.find(item => item.id === itemId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          id: itemId,
          productId,
          name,
          price,
          image,
          quantity,
          customization,
          category,
          variantId
        });
      }

      // Recalculer les totaux
      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      // Champs de compatibilité
      state.itemCount = totals.totalQuantity;
      state.total = totals.totalAmount;
    },
    
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      
      // Recalculer les totaux
      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
    },
    
    updateQuantity: (state, action) => {
      const { itemId, id, quantity } = action.payload;
      const finalItemId = itemId ?? id;
      const item = state.items.find(item => item.id === finalItemId);
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.id !== finalItemId);
        } else {
          item.quantity = quantity;
        }
        
        // Recalculer les totaux
        const totals = calculateTotals(state.items);
        state.totalQuantity = totals.totalQuantity;
        state.totalAmount = totals.totalAmount;
        state.itemCount = totals.totalQuantity;
        state.total = totals.totalAmount;
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
      state.itemCount = 0;
      state.total = 0;
    },
    
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setLoading,
  setError,
  clearError
} = cartSlice.actions;

export default cartSlice.reducer;