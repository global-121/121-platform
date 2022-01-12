import { AuthenticationRole } from './user/user-role.enum';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: AuthenticationRole[]): any =>
  SetMetadata('roles', roles);
