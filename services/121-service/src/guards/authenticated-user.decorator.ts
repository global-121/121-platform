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
  return applyDecorators(
    SetMetadata('authenticationParameters', {
      ...parameters,
      isGuarded: true,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description:
        'User does not have the right permission to access this endpoint.',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Not authenticated.',
    }),
  );
};
