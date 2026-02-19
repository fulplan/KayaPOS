import { create } from 'zustand';
import { type Product, type OrderItem } from './db';

export interface CartItem extends Product {
  quantity: number;
  discount: number;
}

interface StoreState {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateItemDiscount: (productId: number, discount: number) => void;
  clearCart: () => void;
  loadCart: (items: CartItem[]) => void;
  isOffline: boolean;
  setOfflineStatus: (status: boolean) => void;
  taxRate: number;
  taxRuleName: string;
  setTaxRule: (name: string, rate: number) => void;
  orderDiscount: number;
  discountType: 'flat' | 'percentage';
  setOrderDiscount: (discount: number, type: 'flat' | 'percentage') => void;
}

export const useStore = create<StoreState>((set) => ({
  cart: [],
  isOffline: !navigator.onLine,
  taxRate: 0.15,
  taxRuleName: 'VAT (15%)',
  orderDiscount: 0,
  discountType: 'flat' as const,

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

  clearCart: () => set({ cart: [], orderDiscount: 0, discountType: 'flat' as const }),
  loadCart: (items) => set({ cart: items }),
  setOrderDiscount: (discount, type) => set({ orderDiscount: discount, discountType: type }),
  setTaxRule: (name, rate) => set({ taxRuleName: name, taxRate: rate }),
  setOfflineStatus: (status) => set({ isOffline: status }),
}));

window.addEventListener('online', () => useStore.getState().setOfflineStatus(false));
window.addEventListener('offline', () => useStore.getState().setOfflineStatus(true));
