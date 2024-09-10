import { SetMetadata } from '@nestjs/common';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

export interface AuthenticatedUserParameters {
  permissions?: PermissionEnum[];
  isAdmin?: boolean;
  isOrganizationAdmin?: boolean;
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
