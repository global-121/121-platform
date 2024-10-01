import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '~/services/auth.service';

export const organizationAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  if (authService.isOrganizationAdmin) {
    return true;
  }

  const router = inject(Router);
  return router.navigate(['/']);
};
