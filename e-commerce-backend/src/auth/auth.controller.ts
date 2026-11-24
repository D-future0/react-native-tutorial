import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import type { AuthResult, PublicUser } from './auth.service.js';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from './auth.schemas.js';
import type {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
} from './auth.schemas.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: { sub: string };
}

function getDeviceName(request: Request): string | undefined {
  const deviceName =
    request.get('x-device-name')?.trim() || request.get('user-agent')?.trim();
  return deviceName ? deviceName.slice(0, 128) : undefined;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Req() request: Request,
  ): Promise<AuthResult> {
    return this.authService.register(body, getDeviceName(request));
  }

  @Post('login')
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() request: Request,
  ): Promise<AuthResult> {
    return this.authService.login(body, getDeviceName(request));
  }

  @Post('refresh')
  refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) body: RefreshTokenInput,
  ): Promise<AuthResult> {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body(new ZodValidationPipe(refreshTokenSchema)) body: RefreshTokenInput,
  ): Promise<void> {
    await this.authService.revokeRefreshToken(body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() request: AuthenticatedRequest): Promise<PublicUser> {
    return this.authService.getProfile(request.user.sub);
  }
}
