import { HttpException, HttpStatus } from '@nestjs/common';

import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

export class RequestHelper {
  static getUserId(req: ScopedUserRequest): number {
    const userId = req.user?.id;

    if (typeof userId === 'undefined') {
      throw new HttpException(
        'User is not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return userId;
  }
}
