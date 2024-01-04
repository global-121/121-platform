import { SetMetadata } from '@nestjs/common';
import { PermissionEnum } from '../user/enum/permission.enum';

export const Permissions = (...permissions: PermissionEnum[]): any =>
  SetMetadata('permissions', permissions);
