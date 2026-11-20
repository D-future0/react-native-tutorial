import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import {
  orderCreateSchema,
  type OrderCreateInput,
} from '../common/zod-validation.pipe.js';
import { OrdersService } from './orders.service.js';

const product = {
  id: 'product-1',
  name: 'Test product',
  priceCents: 1234,
  stockQuantity: 20,
  imageUrl: 'https://example.com/product.jpg',
};

function createService(products = [product], stockUpdateCount = 1) {
  const orderFindMany = vi.fn().mockResolvedValue([]);
  const orderFindFirst = vi.fn().mockResolvedValue(null);
  const transaction = {
    product: {
      findMany: vi.fn().mockResolvedValue(products),
      updateMany: vi.fn().mockResolvedValue({ count: stockUpdateCount }),
    },
    order: {
      create: vi.fn().mockImplementation(async ({ data }) => ({
        id: 'order-1',
        ...data,
      })),
    },
  };
  const prisma = {
    order: {
      findMany: orderFindMany,
      findFirst: orderFindFirst,
    },
    $transaction: vi.fn(
      (callback: (transaction: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  } as unknown as PrismaService;

  return {
    service: new OrdersService(prisma),
    orderFindMany,
    orderFindFirst,
    transaction,
  };
}

describe('OrdersService', () => {
  it('creates a user-owned order using integer prices and atomic stock updates', async () => {
    const { service, transaction } = createService();
    const input: OrderCreateInput = {
      items: [{ productId: product.id, quantity: 2 }],
      expectedTotalCents: 2468,
    };

    const order = await service.create(input, 'user-1');

    expect(transaction.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: product.id,
        priceCents: product.priceCents,
        stockQuantity: { gte: 2 },
      },
      data: { stockQuantity: { decrement: 2 } },
    });
    expect(transaction.order.create).toHaveBeenCalledWith({
      data: {
        items: JSON.stringify([
          {
            productId: product.id,
            name: product.name,
            priceCents: product.priceCents,
            imageUrl: product.imageUrl,
            quantity: 2,
          },
        ]),
        totalCents: 2468,
        userId: 'user-1',
      },
    });
    expect(order.totalCents).toBe(2468);
  });

  it('rejects a stale total before decrementing inventory', async () => {
    const { service, transaction } = createService();

    await expect(
      service.create(
        {
          items: [{ productId: product.id, quantity: 2 }],
          expectedTotalCents: 1,
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.product.updateMany).not.toHaveBeenCalled();
    expect(transaction.order.create).not.toHaveBeenCalled();
  });

  it('rejects when inventory changes before the conditional update', async () => {
    const { service, transaction } = createService([product], 0);

    await expect(
      service.create(
        {
          items: [{ productId: product.id, quantity: 1 }],
          expectedTotalCents: product.priceCents,
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.order.create).not.toHaveBeenCalled();
  });

  it('rejects missing products without creating an order', async () => {
    const { service, transaction } = createService([]);

    await expect(
      service.create(
        {
          items: [{ productId: product.id, quantity: 1 }],
          expectedTotalCents: product.priceCents,
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.product.updateMany).not.toHaveBeenCalled();
    expect(transaction.order.create).not.toHaveBeenCalled();
  });

  it('scopes order reads to the authenticated user', async () => {
    const { service, orderFindMany, orderFindFirst } = createService();

    await service.findAll('user-1');
    expect(orderFindMany.mock.calls[0]?.[0]).toEqual({ where: { userId: 'user-1' } });

    await expect(service.findOne('order-1', 'user-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(orderFindFirst.mock.calls[0]?.[0]).toEqual({
      where: { id: 'order-1', userId: 'user-2' },
    });
  });

  it('rejects client-supplied prices and invalid quantities', () => {
    expect(
      orderCreateSchema.safeParse({
        items: [{ productId: product.id, quantity: 1, priceCents: 1 }],
        expectedTotalCents: 1,
      }).success,
    ).toBe(false);
    expect(
      orderCreateSchema.safeParse({
        items: [{ productId: product.id, quantity: 0 }],
        expectedTotalCents: 0,
      }).success,
    ).toBe(false);
  });
});
