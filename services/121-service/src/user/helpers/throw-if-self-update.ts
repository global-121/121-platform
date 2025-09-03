import { HttpException, HttpStatus } from '@nestjs/common';

import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { RequestHelper } from '@121-service/src/utils/request-helper/request-helper.helper';

export function throwIfSelfUpdate(
  req: ScopedUserRequest,
  userIdToUpdate: number,
): void {
  const loggedInUserId = RequestHelper.getUserId(req);

  if (loggedInUserId === userIdToUpdate) {
    throw new HttpException(
      'You cannot update your own project assignment',
      HttpStatus.FORBIDDEN,
    );
  }
}
