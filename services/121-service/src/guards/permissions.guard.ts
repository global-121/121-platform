import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { CookieErrors, CookieNames } from '../shared/enum/cookie.enums';
import { InterfaceNames } from '../shared/enum/interface-names.enum';
import { UserToken } from '../user/user.interface';
import { UserService } from '../user/user.service';
import { PermissionEnum } from './../user/permission.enum';
import { GuardsService } from './guards.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
    private readonly guardService: GuardsService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    let hasAccess: boolean;
    const headerKey = 'x-121-interface';

    const endpointPermissions = this.reflector.get<PermissionEnum[]>(
      'permissions',
      context.getHandler(),
    );

    if (!endpointPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (!request.params.programId) {
      throw new Error('Endpoint is missing programId parameter');
    }

    const originInterface: InterfaceNames = request.headers[headerKey];

    if (
      request.cookies &&
      this.guardService.interfacesMatch(request.cookies, originInterface) &&
      endpointPermissions
    ) {
      const token = this.guardService.getToken(
        request.cookies,
        originInterface,
      );
      if (token) {
        const decoded: UserToken = jwt.verify(
          token,
          process.env.SECRETS_121_SERVICE_SECRET,
        );
        if (!decoded && !decoded.id) {
          return false;
        }
        hasAccess = await this.userService.canActivate(
          endpointPermissions,
          request.params.programId,
          decoded.id,
        );
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
