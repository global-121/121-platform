import { Request } from 'express';

import { UserRequestData } from '@121-service/src/user/user.interface';

export interface ScopedUserRequest extends Request {
  user?: UserRequestData;
}

export interface ScopedUserRequestWithUser extends Request {
  user: UserRequestData;
}
