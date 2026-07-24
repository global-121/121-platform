import { HttpException, HttpStatus } from '@nestjs/common';

import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class RequestHelper {
  static getUserId(req: ScopedUserRequest): number {
    const userId = req.user?.id;

    if (userId === undefined) {
      throw new HttpException(
        'User is not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return userId;
  }
  
  static getUserIsAdmin(req: ScopedUserRequest): boolean {
    const isAdmin = req.user?.admin;

    if (isAdmin === undefined) {
      throw new Error('User admin status is not defined');
    }

    return isAdmin;
  }

  static getUserScope(req: ScopedUserRequest): string {
    const userScope = req.user?.scope;

    if (userScope === undefined) {
      throw new Error('User scope is not defined');
    }

    return userScope;
  }
}
