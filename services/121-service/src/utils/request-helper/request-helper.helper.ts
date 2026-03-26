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

  static getUserScope(req: ScopedUserRequest): string {
    const userScope = req.user?.scope;

    if (userScope === undefined) {
      throw new HttpException(
        'User scope is not defined',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return userScope;
  }
}
