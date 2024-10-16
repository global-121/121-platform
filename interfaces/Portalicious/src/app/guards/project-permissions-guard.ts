import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { AuthService } from '~/services/auth.service';

export const projectPermissionsGuard: (
  permission: PermissionEnum,
) => CanActivateFn = (permission: PermissionEnum) => {
  return function projectPermissionsCanActivateFn(
    route: ActivatedRouteSnapshot,
  ) {
    const authService = inject(AuthService);

    const projectId = route.params.projectId as number;

    if (isNaN(projectId)) {
      throw new Error('projectId is not a number');
    }

    if (
      authService.hasPermission({ projectId, requiredPermission: permission })
    ) {
      return true;
    }

    const router = inject(Router);
    return router.navigate(['/', AppRoutes.project, projectId], {
      queryParams: {
        // TODO: implement logic to show message to user when permission is denied.
        permissionDenied: true,
      },
    });
  };
};
