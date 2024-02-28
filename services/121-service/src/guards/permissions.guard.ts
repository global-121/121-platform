import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionEnum } from '../user/enum/permission.enum';
import { UserService } from '../user/user.service';
import { getDecodedTokenOrThrow } from './guard.helper';

@Injectable()
export class PermissionsGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const decoded = getDecodedTokenOrThrow(request);

    const hasAccess = await this.userService.canActivate(
      endpointPermissions,
      request.params.programId,
      decoded.id,
    );

    if (!hasAccess) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    return hasAccess;
  }
}
