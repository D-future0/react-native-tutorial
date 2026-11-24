import { z } from 'zod';

const emailSchema = z.string().trim().email().max(254).transform((email) =>
  email.toLowerCase(),
);

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8)
    .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
      message: 'Password must be no more than 72 bytes',
    }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(40).max(256),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
