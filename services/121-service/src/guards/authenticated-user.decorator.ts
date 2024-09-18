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
): ReturnType<typeof SetMetadata> =>
  SetMetadata('authenticationParameters', {
    ...parameters,
    isGuarded: true,
  });
