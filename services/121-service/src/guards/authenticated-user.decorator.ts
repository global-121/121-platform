import { applyDecorators, HttpStatus, SetMetadata } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

export interface AuthenticatedUserParameters {
  permissions?: PermissionEnum[];
  isAdmin?: boolean;
  isOrganizationAdmin?: boolean;
  readonly isGuarded?: boolean;
}

export const AuthenticatedUser = (parameters?: AuthenticatedUserParameters) => {
  let permissionsDescription = '';
  if (parameters?.permissions) {
    permissionsDescription = `Required permissions: ${parameters.permissions.join(', ')}`;
  }
  if (parameters?.isAdmin) {
    permissionsDescription = 'User must be an admin.';
  }
  if (parameters?.isOrganizationAdmin) {
    permissionsDescription = 'User must be an organization admin.';
  }

  return applyDecorators(
    SetMetadata('authenticationParameters', {
      ...parameters,
      isGuarded: true,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: `User does not have the right permission to access this endpoint. \n (${permissionsDescription})`,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Not authenticated.',
    }),
  );
};
