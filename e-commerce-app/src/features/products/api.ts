import { apiRequest } from '../lib/api-client';
import type { Product } from '../types';

export function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  return apiRequest<Product[]>('/products', { signal });
}

export function fetchProduct(
  id: string,
  signal?: AbortSignal,
): Promise<Product> {
  return apiRequest<Product>(`/products/${encodeURIComponent(id)}`, {
    signal,
  });
}