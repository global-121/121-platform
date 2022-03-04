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
export class PersonAffectedAuthGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    let hasAccess: boolean;
    const accessTokenKey = 'access_token_pa';

    const endpointPersonAffectedAuth = this.reflector.get<PermissionEnum[]>(
      'personAffectedAuth',
      context.getHandler(),
    );

    if (!endpointPersonAffectedAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    if (
      request.cookies &&
      request.cookies[accessTokenKey] &&
      endpointPersonAffectedAuth.length === 0
    ) {
      const token = request.cookies[accessTokenKey];
      const decoded: any = jwt.verify(
        token,
        process.env.SECRETS_121_SERVICE_SECRET,
      );
      const user = await this.userService.findById(decoded.id);
      if (user.userType === UserType.personAffected) {
        hasAccess = await this.personAffectedCanActivate(user, request);
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

  private async personAffectedCanActivate(
    user: UserEntity,
    request: any,
  ): Promise<boolean> {
    let referenceIdsOfUser = [];

    if (user.registrations && user.registrations[0]) {
      referenceIdsOfUser = user.registrations.map(r => r.referenceId);
    }

    if (
      request.body &&
      request.body.referenceId &&
      !referenceIdsOfUser.includes(request.body.referenceId)
    ) {
      // Person affected send request with reference id in body that is not part of its registrations
      return false;
    }
    if (
      request.params &&
      request.params.referenceId &&
      !referenceIdsOfUser.includes(request.params.referenceId)
    ) {
      // Person affected send request with reference id in body that is not part of its registrations
      return false;
    }

    return true;
  }
}
