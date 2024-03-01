import { SetMetadata } from '@nestjs/common';
import { PermissionEnum } from '../user/enum/permission.enum';

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
    // TODO: Find a way to make this 'authenticated' part more explicit
    isGuarded: true,
  });
