import { SetMetadata } from '@nestjs/common';
import { PermissionEnum } from './../user/permission.enum';

export const Permissions = (...permissions: PermissionEnum[]): any =>
  SetMetadata('permissions', permissions);
