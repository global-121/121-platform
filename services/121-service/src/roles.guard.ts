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
import { DEBUG } from './config';
import { UserRole } from './user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    let hasAccess: boolean;

    if (DEBUG) {
      return true;
    }
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!roles) {
      return true;
    }
    // This line allows the Admin role to access every controller
    if (!roles.includes(UserRole.Admin)) {
      roles.push(UserRole.Admin);
    }

    const request = context.switchToHttp().getRequest();
    const authHeaders = request.headers.authorization;
    if (authHeaders && (authHeaders as string).split(' ')[1]) {
      const token = (authHeaders as string).split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.SECRETS_121_SERVICE_SECRET);
      const user = await this.userService.findById(decoded.id);

      hasAccess = roles.includes(user.user.role);
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
}
