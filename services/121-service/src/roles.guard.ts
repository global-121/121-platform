import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { UserService } from './user/user.service';
import { SECRET } from './secrets';
import { DEBUG } from './config';
import { IGetUserAuthInfoRequest } from './user/get-user-auth-info-request';
import { UserRole } from './user-roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let hasAccess: boolean;

    if (DEBUG) {
      return true
    }
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    console.log('roles: ', roles);


    if (!roles) {
      console.log('Everyone can access')
      return true;
    }
    // This line allows the Admin role to access every controller
    roles.push(UserRole.Admin)

    console.log('Roles guardd1!!!', roles);
    const request = context.switchToHttp().getRequest()
    const authHeaders = request.headers.authorization;
    // console.log('authHeaders: ', authHeaders);
    if (authHeaders && (authHeaders as string).split(' ')[1]) {
      const token = (authHeaders as string).split(' ')[1];
      const decoded: any = jwt.verify(token, SECRET);
      const user = await this.userService.findById(decoded.id);
      console.log('user: ', user);

      hasAccess = roles.includes(user.user.role);
    } else {
      hasAccess = false;
    }
    return hasAccess;
  }
}
