import { apiRequest } from '../lib/api-client';
import type { CreateOrderInput, Order } from '../types';

export function fetchOrders(signal?: AbortSignal): Promise<Order[]> {
  return apiRequest<Order[]>('/orders', { signal });
}

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return apiRequest<Order>('/orders', {
    method: 'POST',
    body: input,
  });
}