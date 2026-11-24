import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product } from '../types';
import { useCartStore } from '../cart/store';
import { fetchProduct, fetchProducts } from './api';
import { isConfirmedProductUnavailable } from './product-availability';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: ({ signal }) => fetchProducts(signal),
  });
}

export function useProduct(id: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['products', id],
    queryFn: ({ signal }) => fetchProduct(id, signal),
    enabled: id.length > 0,
    retry: (failureCount, error) =>
      !isConfirmedProductUnavailable(error) && failureCount < 1,
  });

  useEffect(() => {
    if (!isConfirmedProductUnavailable(query.error)) {
      return;
    }

    queryClient.setQueryData<Product[]>(['products'], (products) =>
      products?.filter((product) => product.id !== id),
    );
    queryClient.setQueryData<Product[]>(['cart-products'], (products) =>
      products?.filter((product) => product.id !== id),
    );
    useCartStore.getState().markUnavailable(id);
  }, [id, query.error, queryClient]);

  return query;
}