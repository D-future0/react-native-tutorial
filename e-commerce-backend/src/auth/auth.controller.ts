import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import type { AuthResult, PublicUser } from './auth.service.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: { sub: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
  ): Promise<AuthResult> {
    return this.authService.register(body);
  }

  @Post('login')
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
  ): Promise<AuthResult> {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() request: AuthenticatedRequest): Promise<PublicUser> {
    return this.authService.getProfile(request.user.sub);
  }
}
