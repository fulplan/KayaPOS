import { create } from 'zustand';
import { type Product } from './db';

export interface CartItem extends Product {
  quantity: number;
  discount: number; // flat discount per unit
}

interface StoreState {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateItemDiscount: (productId: number, discount: number) => void;
  clearCart: () => void;
  isOffline: boolean;
  setOfflineStatus: (status: boolean) => void;
  taxRate: number;
  orderDiscount: number; // flat order-level discount
  setOrderDiscount: (discount: number) => void;
}

export const useStore = create<StoreState>((set) => ({
  cart: [],
  isOffline: !navigator.onLine,
  taxRate: 0.15, // Default 15% VAT
  orderDiscount: 0,
  
  addToCart: (product) => set((state) => {
    const existing = state.cart.find(p => p.id === product.id);
    if (existing) {
      return {
        cart: state.cart.map(p => 
          p.id === product.id 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      };
    }
    return { cart: [...state.cart, { ...product, quantity: 1, discount: 0 }] };
  }),

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(p => p.id !== productId)
  })),

  updateQuantity: (productId, quantity) => set((state) => ({
    cart: state.cart.map(p => 
      p.id === productId 
        ? { ...p, quantity }
        : p
    ).filter(p => p.quantity > 0)
  })),

  updateItemDiscount: (productId, discount) => set((state) => ({
    cart: state.cart.map(p => 
      p.id === productId ? { ...p, discount } : p
    )
  })),

  clearCart: () => set({ cart: [], orderDiscount: 0 }),
  setOrderDiscount: (discount) => set({ orderDiscount: discount }),
  setOfflineStatus: (status) => set({ isOffline: status }),
}));

// Listen to online/offline events
window.addEventListener('online', () => useStore.getState().setOfflineStatus(false));
window.addEventListener('offline', () => useStore.getState().setOfflineStatus(true));
