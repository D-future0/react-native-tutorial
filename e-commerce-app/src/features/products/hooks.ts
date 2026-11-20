import { useQuery } from '@tanstack/react-query';
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
    queryFn: ({ signal }) => fetchProduct(id, signal),
    enabled: id.length > 0,
  });
}