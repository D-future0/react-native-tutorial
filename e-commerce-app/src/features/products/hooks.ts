import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../lib/api-client';
import { fetchProduct, fetchProducts } from './api';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: ({ signal }) => fetchProducts(signal),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async ({ signal }) => {
      try {
        return await fetchProduct(id, signal);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: id.length > 0,
  });
}