import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { SetMetadata } from '@nestjs/common';

export interface AuthenticatedUserParameters {
  permissions?: PermissionEnum[];
  isAdmin?: boolean;
  readonly isGuarded?: boolean;
}

export const AuthenticatedUser = (
  parameters?: AuthenticatedUserParameters,
): any =>
  SetMetadata('authenticationParameters', {
    ...parameters,
    // TODO: Find a way to make this 'isGuarded' part more explicit
    isGuarded: true,
  });
