export interface Product {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  stockQuantity: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartLine {
  productId: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
  available?: boolean;
  stockQuantity?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
}

export interface CreateOrderInput {
  items: Pick<CartLine, 'productId' | 'quantity'>[];
  expectedTotalCents: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalCents: number;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
}