import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuthStore } from '../auth/store';
import { createOrder, fetchOrders } from './api';
import type { CreateOrderInput } from '../types';

export function useOrders() {
  const accessToken = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: ['orders'],
    queryFn: ({ signal }) => {
      if (!accessToken) {
        throw new Error('Sign in to view your orders.');
      }
      return fetchOrders(accessToken, signal);
    },
    enabled: Boolean(accessToken),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: (input: CreateOrderInput) => {
      if (!onlineManager.isOnline()) {
        throw new Error('You are offline. Orders are not queued for later.');
      }
      if (!accessToken) {
        throw new Error('Sign in before placing an order.');
      }
      return createOrder(accessToken, input);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['cart-products'] }),
      ]);
    },
  });
}