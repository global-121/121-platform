import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { AuthService } from '~/services/auth.service';

export const PERMISSION_DENIED_QUERY_KEY = 'permissionDenied';

interface programPermissionsGuardType {
  permission: PermissionEnum;
  fallbackRoute?: string[];
}

export const programPermissionsGuard: ({
  permission,
  fallbackRoute,
}: programPermissionsGuardType) => CanActivateFn = ({
  permission,
  fallbackRoute,
}: programPermissionsGuardType) =>
  function programPermissionsCanActivateFn(route: ActivatedRouteSnapshot) {
    const authService = inject(AuthService);

    const programId = route.params.programId as number;

    if (
      authService.hasPermission({ programId, requiredPermission: permission })
    ) {
      return true;
    }

    if (fallbackRoute) {
      return inject(Router).createUrlTree([
        '/',
        AppRoutes.program,
        programId,
        ...fallbackRoute,
      ]);
    }

    return inject(Router).createUrlTree(['/', AppRoutes.program, programId], {
      queryParams: {
        [PERMISSION_DENIED_QUERY_KEY]: true,
      },
    });
  };
