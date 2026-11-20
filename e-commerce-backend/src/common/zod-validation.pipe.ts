import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodType, z } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: result.error.issues,
      });
    }

    return result.data;
  }
}
export const orderCreateSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            productId: z.string().trim().min(1),
            quantity: z
              .number()
              .int()
              .positive()
              .refine(Number.isSafeInteger, 'Quantity must be a safe integer'),
          })
          .strict(),
      )
      .min(1),
    expectedTotal: z
      .number()
      .finite()
      .nonnegative()
      .refine((value) => Number.isSafeInteger(Math.round(value * 100))),
  })
  .strict();
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export const orderIdSchema = z.string().trim().min(1);

export interface Product {
  id: string;
  [key: string]: unknown;
}

export const productIdSchema = z.string().trim().min(1);