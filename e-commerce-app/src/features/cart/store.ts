import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartLine, Product } from '../types';

interface CartStore {
  items: CartLine[];
  isHydrated: boolean;
  refreshError: string | null;
  setHydrated: (isHydrated: boolean) => void;
  setRefreshError: (error: string | null) => void;
  addItem: (product: Product) => void;
  syncProducts: (products: Product[]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isHydrated: false,
      refreshError: null,
      setHydrated: (isHydrated) => set({ isHydrated }),
      setRefreshError: (refreshError) => set({ refreshError }),
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.productId === product.id,
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? {
                      ...item,
                      name: product.name,
                      price: product.price,
                      imageUrl: product.imageUrl,
                      quantity: item.quantity + 1,
                      available: true,
                    }
                  : item,
              ),
              refreshError: null,
            };
          }

          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: 1,
                available: true,
              },
            ],
            refreshError: null,
          };
        }),
      syncProducts: (products) =>
        set((state) => {
          const productsById = new Map(
            products.map((product) => [product.id, product]),
          );
          return {
            items: state.items.map((item) => {
              const product = productsById.get(item.productId);
              return product
                ? {
                    ...item,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    available: true,
                  }
                : { ...item, available: false };
            }),
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity < 1
              ? state.items.filter((item) => item.productId !== productId)
              : state.items.map((item) =>
                  item.productId === productId
                    ? { ...item, quantity: Math.floor(quantity) }
                    : item,
                ),
        })),
      clearCart: () => set({ items: [], refreshError: null }),
    }),
    {
      name: 'ecommerce-cart-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
