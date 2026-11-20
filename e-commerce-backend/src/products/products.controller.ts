import { Controller, Get, Param } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ProductsService } from './products.service.js';
import { Product, productIdSchema } from '../common/zod-validation.pipe.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', new ZodValidationPipe(productIdSchema)) id: string,
  ): Promise<Product> {
    return this.productsService.findOne(id);
  }
}
