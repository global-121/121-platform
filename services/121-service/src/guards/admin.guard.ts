import { GuardsService } from './guards.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { CookieNames, CookieErrors } from '../shared/enum/cookie.enums';
import { InterfaceNames } from '../shared/enum/interface-names.enum';
import { UserToken } from '../user/user.interface';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly guardsService: GuardsService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    let hasAccess: boolean;
    const headerKey = 'x-121-interface';

    const endpointAdminAuth = this.reflector.get<any[]>(
      'admin',
      context.getHandler(),
    );

    if (!endpointAdminAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const originInterface: InterfaceNames = request.headers[headerKey];
    if (
      request.cookies &&
      this.guardsService.interfacesMatch(request.cookies, originInterface)
    ) {
      const token = this.guardsService.getToken(
        request.cookies,
        originInterface,
      );
      if (token) {
        const decoded: UserToken = jwt.verify(
          token,
          process.env.SECRETS_121_SERVICE_SECRET,
        );
        if (!decoded) {
          return false;
        }
        hasAccess = decoded.admin === true;
      }
    } else {
      hasAccess = false;
    }
    if (hasAccess === false) {
      // Add this to stay consitent with the old auth middeleware which returns 401
      // If you remove this an unautherized request return 403 will be sent
      if (
        request.cookies[CookieNames.old] ||
        Object.keys(request.cookies).length === 0
      ) {
        throw new HttpException(CookieErrors.oldOrNo, HttpStatus.UNAUTHORIZED);
      } else {
        throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
      }
    }
    return hasAccess;
  }
}
