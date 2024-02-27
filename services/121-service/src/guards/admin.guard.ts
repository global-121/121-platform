import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getDecodedTokenOrThrow } from './guard.helper';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const endpointAdminAuth = this.reflector.get<any[]>(
      'admin',
      context.getHandler(),
    );

    if (!endpointAdminAuth) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const decoded = getDecodedTokenOrThrow(request);
    const hasAccess = decoded.admin === true;
    if (!hasAccess) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    return hasAccess;
  }
}
