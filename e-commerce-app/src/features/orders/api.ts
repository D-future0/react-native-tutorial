import { apiRequest } from '../lib/api-client';
import type { CreateOrderInput, Order } from '../types';

export function fetchOrders(
  token: string,
  signal?: AbortSignal,
): Promise<Order[]> {
  return apiRequest<Order[]>('/orders', { token, signal });
}

export function createOrder(
  token: string,
  input: CreateOrderInput,
): Promise<Order> {
  return apiRequest<Order>('/orders', {
    method: 'POST',
    body: input,
    token,
  });
}