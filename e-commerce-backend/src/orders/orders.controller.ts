import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ZodValidationPipe,
  orderCreateSchema,
  orderIdSchema,
} from '../common/zod-validation.pipe.js';
import type { OrderCreateInput } from '../common/zod-validation.pipe.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Order, OrdersService } from './orders.service.js';

interface AuthenticatedRequest extends Request {
  user: { sub: string };
}

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest): Promise<Order[]> {
    return this.ordersService.findAll(request.user.sub);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(orderCreateSchema))
    body: OrderCreateInput,
    @Req() request: AuthenticatedRequest,
  ): Promise<Order> {
    return this.ordersService.create(body, request.user.sub);
  }

  @Get(':id')
  findOne(
    @Param('id', new ZodValidationPipe(orderIdSchema)) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<Order> {
    return this.ordersService.findOne(id, request.user.sub);
  }
}
