import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ZodValidationPipe,
  orderCreateSchema,
  orderIdSchema,
} from '../common/zod-validation.pipe.js';
import type { OrderCreateInput } from '../common/zod-validation.pipe.js';
import { Order, OrdersService } from './orders.service.js';



@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(orderCreateSchema))
    body: OrderCreateInput,
  ): Promise<Order> {
    return this.ordersService.create(body);
  }

  @Get(':id')
  findOne(
    @Param('id', new ZodValidationPipe(orderIdSchema)) id: string,
  ): Promise<Order> {
    return this.ordersService.findOne(id);
  }
}
