import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../products/api';
import { useCartStore } from './store';

export const cartProductsQueryKey = ['cart-products'] as const;

export default function CartBackgroundRefresh() {
  const itemCount = useCartStore((state) => state.items.length);
  const syncProducts = useCartStore((state) => state.syncProducts);
  const setRefreshError = useCartStore((state) => state.setRefreshError);
  const query = useQuery({
    queryKey: cartProductsQueryKey,
    queryFn: ({ signal }) => fetchProducts(signal),
    enabled: itemCount > 0,
    refetchInterval: itemCount > 0 ? 60_000 : false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (query.data && !query.isRefetchError) {
      syncProducts(query.data);
      setRefreshError(null);
    } else if (query.isRefetchError || query.isError) {
      setRefreshError(
        query.error instanceof Error
          ? query.error.message
          : 'The latest product prices could not be loaded.',
      );
    }
  }, [
    query.data,
    query.error,
    query.isError,
    query.isRefetchError,
    setRefreshError,
    syncProducts,
  ]);

  return null;
}
