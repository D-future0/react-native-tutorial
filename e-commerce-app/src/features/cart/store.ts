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
  addItem: (product: Product) => boolean;
  markUnavailable: (productId: string) => void;
  syncProducts: (products: Product[]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function migrateCartItems(value: unknown): CartLine[] {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return [];
  }

  return value.items
    .map((item): CartLine | null => {
      if (!isRecord(item)) {
        return null;
      }

      const priceCents =
        typeof item.priceCents === 'number'
          ? item.priceCents
          : typeof item.price === 'number' && Number.isFinite(item.price)
            ? Math.round(item.price * 100)
            : null;

      if (
        typeof item.productId !== 'string' ||
        typeof item.name !== 'string' ||
        typeof item.imageUrl !== 'string' ||
        typeof item.quantity !== 'number' ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        priceCents === null ||
        !Number.isSafeInteger(priceCents) ||
        priceCents < 0
      ) {
        return null;
      }

      return {
        productId: item.productId,
        name: item.name,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        priceCents,
        available:
          typeof item.available === 'boolean' ? item.available : undefined,
        stockQuantity:
          typeof item.stockQuantity === 'number' &&
          Number.isSafeInteger(item.stockQuantity) &&
          item.stockQuantity >= 0
            ? item.stockQuantity
            : undefined,
      };
    })
    .filter((item): item is CartLine => item !== null);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isHydrated: false,
      refreshError: null,
      setHydrated: (isHydrated) => set({ isHydrated }),
      setRefreshError: (refreshError) => set({ refreshError }),
      addItem: (product) => {
        let added = false;
        set((state) => {
          const existing = state.items.find(
            (item) => item.productId === product.id,
          );
          if (
            product.stockQuantity <= 0 ||
            existing?.available === false ||
            (existing && existing.quantity >= product.stockQuantity)
          ) {
            return state;
          }
          added = true;
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? {
                      ...item,
                      name: product.name,
                      priceCents: product.priceCents,
                      imageUrl: product.imageUrl,
                      quantity: item.quantity + 1,
                      stockQuantity: product.stockQuantity,
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
                priceCents: product.priceCents,
                imageUrl: product.imageUrl,
                quantity: 1,
                available: true,
                stockQuantity: product.stockQuantity,
              },
            ],
            refreshError: null,
          };
        });
        return added;
      },
      markUnavailable: (productId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, available: false }
              : item,
          ),
        })),
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
                    priceCents: product.priceCents,
                    imageUrl: product.imageUrl,
                    stockQuantity: product.stockQuantity,
                    available: product.stockQuantity > 0,
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
              : state.items.map((item) => {
                  if (item.productId !== productId) {
                    return item;
                  }
                  const requested = Math.max(1, Math.floor(quantity));
                  const capped =
                    item.stockQuantity && item.stockQuantity > 0
                      ? Math.min(requested, item.stockQuantity)
                      : requested;
                  return { ...item, quantity: capped };
                }),
        })),
      clearCart: () => set({ items: [], refreshError: null }),
    }),
    {
      name: 'ecommerce-cart-v1',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
      migrate: (persistedState) => ({
        items: migrateCartItems(persistedState),
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
