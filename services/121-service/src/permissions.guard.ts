import { PermissionEnum } from './user/permission.enum';
import { UserEntity } from './user/user.entity';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { UserService } from './user/user.service';
import { UserType } from './user/user-type-enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    let hasAccess: boolean;
    const headerKey = 'x-121-interface';
    const accessTokenKeyPortal = 'access_token_portal';
    const accessTokenKeyAwApp = 'access_token_aw';
    const accessTokenKeyPaApp = 'access_token_pa';

    const interfaceOriginPortal = 'portal';
    const interfaceOriginAwApp = 'AW-app';
    const interfaceOriginPaApp = 'PA-app';

    const endpointPermissions = this.reflector.get<PermissionEnum[]>(
      'permissions',
      context.getHandler(),
    );

    if (!endpointPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const originInterface = request.headers[headerKey];

    if (
      request.cookies &&
      (request.cookies[accessTokenKeyPortal] ||
        request.cookies[accessTokenKeyAwApp] ||
        request.cookies[accessTokenKeyPaApp]) &&
      endpointPermissions
    ) {
      let token;
      switch (originInterface) {
        case interfaceOriginPortal:
          token = request.cookies[accessTokenKeyPortal];
          break;
        case interfaceOriginAwApp:
          token = request.cookies[accessTokenKeyAwApp];
          break;
        case interfaceOriginPaApp:
          token = request.cookies[accessTokenKeyPaApp];
          // Or AW login: token = request.cookies['access_token_pa_aw'];
          break;

        default:
          break;
      }
      if (token) {
        const decoded: any = jwt.verify(
          token,
          process.env.SECRETS_121_SERVICE_SECRET,
        );
        if (decoded.permissions) {
          hasAccess = await this.aidworkerCanActivate(
            decoded.permissions,
            endpointPermissions,
          );
        }
      }
    } else {
      hasAccess = false;
    }
    if (hasAccess === false) {
      // Add this to stay consitent with the old auth middeleware which returns 401
      // If you remove this an unautherized request return 403 will be sent
      throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
    }
    return hasAccess;
  }

  private async aidworkerCanActivate(
    userPermissions: PermissionEnum[],
    endpointPermissions: PermissionEnum[],
  ): Promise<boolean> {
    const overlappingPermissions = userPermissions.filter(permission =>
      endpointPermissions.includes(permission),
    );
    return overlappingPermissions.length > 0;
  }
}
