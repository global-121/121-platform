import { Request } from 'express';

import { UserRequestData } from '../user/user.interface';

export interface ScopedUserRequest extends Request {
  user?: UserRequestData;
}
