export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  available?: boolean;
}

export interface CreateOrderInput {
  items: Pick<CartLine, 'productId' | 'quantity'>[];
  expectedTotal: number;
}

export interface Order {
  id: string;
  items: CartLine[];
  total: number;
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