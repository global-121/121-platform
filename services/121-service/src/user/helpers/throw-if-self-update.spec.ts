import { HttpException, HttpStatus } from '@nestjs/common';

import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';
import { throwIfSelfUpdate } from '@121-service/src/user/helpers/throw-if-self-update';

describe('throwIfSelfUpdate', () => {
  it('should throw an error if the logged-in user tries to update their own assignment', () => {
    const req = { user: { id: 1 } } as ScopedUserRequest;
    const userIdToUpdate = 1;

    expect(() => throwIfSelfUpdate(req, userIdToUpdate)).toThrow(
      new HttpException(
        'You cannot update your own project assignment',
        HttpStatus.FORBIDDEN,
      ),
    );
  });

  it('should not throw an error if the logged-in user updates another user', () => {
    const req = { user: { id: 1 } } as ScopedUserRequest;
    const userIdToUpdate = 2;

    expect(() => throwIfSelfUpdate(req, userIdToUpdate)).not.toThrow();
  });
});
