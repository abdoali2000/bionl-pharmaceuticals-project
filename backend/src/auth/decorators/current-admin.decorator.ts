import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AdminUser } from '../strategies/jwt.strategy';

/**
 * Extracts the authenticated admin from the request.
 * Usage: @CurrentAdmin() admin: AdminUser
 */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AdminUser }>();
    return request.user;
  },
);
