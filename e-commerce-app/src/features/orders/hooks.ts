import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrder, fetchOrders } from './api';
import type { CreateOrderInput } from '../types';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: ({ signal }) => fetchOrders(signal),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}