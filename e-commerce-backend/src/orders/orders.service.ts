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
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
}

interface OrderRecord {
  id: string;
  items: string;
  total: number;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Order[]> {
    const orders = await this.prisma.order.findMany();
    return orders.map((order: OrderRecord) => this.deserialize(order));
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return this.deserialize(order);
  }

  async create(body: OrderCreateInput): Promise<Order> {
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
          throw new InternalServerErrorException('Product lookup failed');
        }
        if (!Number.isFinite(product.price) || product.price < 0) {
          throw new InternalServerErrorException(
            `Product ${productId} has an invalid price`,
          );
        }

        const unitPriceCents = Math.round(product.price * 100);
        const lineTotalCents = unitPriceCents * quantity;
        if (
          !Number.isSafeInteger(unitPriceCents) ||
          !Number.isSafeInteger(lineTotalCents) ||
          !Number.isSafeInteger(totalCents + lineTotalCents)
        ) {
          throw new BadRequestException('Order total is too large');
        }
        totalCents += lineTotalCents;

        return {
          productId: product.id,
          name: product.name,
          price: unitPriceCents / 100,
          imageUrl: product.imageUrl,
          quantity,
        };
      });

      if (Math.round(body.expectedTotal * 100) !== totalCents) {
        throw new ConflictException(
          'Product prices changed. Review the updated total before placing your order.',
        );
      }

      return transaction.order.create({
        data: {
          items: JSON.stringify(items),
          total: totalCents / 100,
        },
      });
    });

    return this.deserialize(order);
  }

  private deserialize(order: OrderRecord): Order {
    return {
      id: order.id,
      items: JSON.parse(order.items),
      total: order.total,
    };
  }
}
