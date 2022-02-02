import { PermissionEnum } from './user/permission.enum';
import { SetMetadata } from '@nestjs/common';

export const Permissions = (...permissions: PermissionEnum[]): any =>
  SetMetadata('permissions', permissions);
