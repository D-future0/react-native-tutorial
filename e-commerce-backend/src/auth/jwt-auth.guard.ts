import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token, ...extra] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token || extra.length > 0) {
      throw new UnauthorizedException('Bearer token required');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
        throw new UnauthorizedException('Invalid access token');
      }
      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
