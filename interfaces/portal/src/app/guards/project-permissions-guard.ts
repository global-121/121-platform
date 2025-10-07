import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { AuthService } from '~/services/auth.service';

export const PERMISSION_DENIED_QUERY_KEY = 'permissionDenied';

interface projectPermissionsGuardType {
  permission: PermissionEnum;
  fallbackRoute?: string[];
}

export const projectPermissionsGuard: ({
  permission,
  fallbackRoute,
}: projectPermissionsGuardType) => CanActivateFn = ({
  permission,
  fallbackRoute,
}: projectPermissionsGuardType) =>
  function projectPermissionsCanActivateFn(route: ActivatedRouteSnapshot) {
    const authService = inject(AuthService);

    const projectId = route.params.projectId as number;

    if (
      authService.hasPermission({ projectId, requiredPermission: permission })
    ) {
      return true;
    }

    if (fallbackRoute) {
      return inject(Router).createUrlTree([
        '/',
        AppRoutes.project,
        projectId,
        ...fallbackRoute,
      ]);
    }

    return inject(Router).createUrlTree(['/', AppRoutes.project, projectId], {
      queryParams: {
        [PERMISSION_DENIED_QUERY_KEY]: true,
      },
    });
  };
