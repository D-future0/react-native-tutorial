import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../types';
import { useCartStore } from './store';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

const product: Product = {
  id: 'product-1',
  name: 'Saved product',
  description: null,
  priceCents: 1200,
  stockQuantity: 3,
  imageUrl: 'https://store.test/product.png',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('cart product availability', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [
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
    });
  });

  it('marks a confirmed missing product unavailable and blocks adding it again', () => {
    useCartStore.getState().markUnavailable(product.id);

    expect(useCartStore.getState().items[0]?.available).toBe(false);
    expect(useCartStore.getState().addItem(product)).toBe(false);
    expect(useCartStore.getState().items[0]?.quantity).toBe(1);
  });
});
