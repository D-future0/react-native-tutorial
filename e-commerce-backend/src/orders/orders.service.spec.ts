import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import {
  orderCreateSchema,
  type OrderCreateInput,
} from '../common/zod-validation.pipe.js';
import { OrdersService } from './orders.service.js';

const product = {
  id: 'product-1',
  name: 'Test product',
  price: 12.34,
  imageUrl: 'https://example.com/product.jpg',
};

function createService(products = [product]) {
  const transaction = {
    product: {
      findMany: vi.fn().mockResolvedValue(products),
    },
    order: {
      create: vi.fn().mockImplementation(async ({ data }) => ({
        id: 'order-1',
        ...data,
      })),
    },
  };
  const prisma = {
    $transaction: vi.fn(
      (callback: (transaction: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  } as unknown as PrismaService;

  return { service: new OrdersService(prisma), transaction };
}

describe('OrdersService', () => {
  it('creates orders with database prices and a rounded server total', async () => {
    const { service, transaction } = createService();
    const input: OrderCreateInput = {
      items: [{ productId: product.id, quantity: 2 }],
      expectedTotal: 24.68,
    };

    const order = await service.create(input);

    expect(transaction.order.create).toHaveBeenCalledWith({
      data: {
        items: JSON.stringify([
          {
            productId: product.id,
            name: product.name,
            price: 12.34,
            imageUrl: product.imageUrl,
            quantity: 2,
          },
        ]),
        total: 24.68,
      },
    });
    expect(order.total).toBe(24.68);
  });

  it('rejects orders when prices changed since the cart was refreshed', async () => {
    const { service, transaction } = createService();

    await expect(
      service.create({
        items: [{ productId: product.id, quantity: 2 }],
        expectedTotal: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.order.create).not.toHaveBeenCalled();
  });

  it('rejects unavailable products without creating an order', async () => {
    const { service, transaction } = createService([]);

    await expect(
      service.create({
        items: [{ productId: product.id, quantity: 1 }],
        expectedTotal: 12.34,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.order.create).not.toHaveBeenCalled();
  });

  it('rejects client-supplied prices and invalid quantities', () => {
    expect(
      orderCreateSchema.safeParse({
        items: [{ productId: product.id, quantity: 1, price: 0.01 }],
        expectedTotal: 0.01,
      }).success,
    ).toBe(false);
    expect(
      orderCreateSchema.safeParse({
        items: [{ productId: product.id, quantity: 0 }],
        expectedTotal: 0,
      }).success,
    ).toBe(false);
  });
});
