import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { OrderCreateInput } from '../common/zod-validation.pipe.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface OrderItem {
  productId: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalCents: number;
}

interface OrderRecord {
  id: string;
  items: string;
  totalCents: number;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({ where: { userId } });
    return orders.map((order: OrderRecord) => this.deserialize(order));
  }

  async findOne(id: string, userId: string): Promise<Order> {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return this.deserialize(order);
  }

  async create(body: OrderCreateInput, userId: string): Promise<Order> {
    const order = await this.prisma.$transaction(async (transaction) => {
      const requestedQuantities = new Map<string, number>();
      for (const item of body.items) {
        const quantity =
          (requestedQuantities.get(item.productId) ?? 0) + item.quantity;
        if (!Number.isSafeInteger(quantity)) {
          throw new BadRequestException('Combined item quantity is too large');
        }
        requestedQuantities.set(item.productId, quantity);
      }

      const products = await transaction.product.findMany({
        where: { id: { in: [...requestedQuantities.keys()] } },
      });
      const productById = new Map(products.map((product) => [product.id, product]));
      const missingProduct = [...requestedQuantities.keys()].find(
        (productId) => !productById.has(productId),
      );
      if (missingProduct) {
        throw new ConflictException(
          'A product in your bag is no longer available. Refresh your bag and try again.',
        );
      }

      let totalCents = 0;
      const items = [...requestedQuantities].map(([productId, quantity]) => {
        const product = productById.get(productId);
        if (!product) {
          throw new ConflictException(
            'A product in your bag is no longer available. Refresh your bag and try again.',
          );
        }
        if (!Number.isSafeInteger(product.priceCents) || product.priceCents < 0) {
          throw new InternalServerErrorException(
            `Product ${productId} has an invalid price`,
          );
        }
        if (product.stockQuantity < quantity) {
          throw new ConflictException(
            `Only ${product.stockQuantity} units of ${product.name} remain in stock.`,
          );
        }

        const lineTotalCents = product.priceCents * quantity;
        if (
          !Number.isSafeInteger(lineTotalCents) ||
          !Number.isSafeInteger(totalCents + lineTotalCents) ||
          totalCents + lineTotalCents > 2_147_483_647
        ) {
          throw new BadRequestException('Order total is too large');
        }
        totalCents += lineTotalCents;

        return {
          productId: product.id,
          name: product.name,
          priceCents: product.priceCents,
          imageUrl: product.imageUrl,
          quantity,
        };
      });

      if (body.expectedTotalCents !== totalCents) {
        throw new ConflictException(
          'Product prices changed. Review the updated total before placing your order.',
        );
      }

      for (const item of items) {
        const result = await transaction.product.updateMany({
          where: {
            id: item.productId,
            priceCents: item.priceCents,
            stockQuantity: { gte: item.quantity },
          },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (result.count !== 1) {
          throw new ConflictException(
            'Stock or pricing changed. Refresh your bag and try again.',
          );
        }
      }

      return transaction.order.create({
        data: {
          items: JSON.stringify(items),
          totalCents,
          userId,
        },
      });
    });

    return this.deserialize(order);
  }

  private deserialize(order: OrderRecord): Order {
    return {
      id: order.id,
      items: JSON.parse(order.items),
      totalCents: order.totalCents,
    };
  }
}
