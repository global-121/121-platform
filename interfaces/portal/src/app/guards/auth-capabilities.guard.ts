import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '~/services/auth.service';

export const authCapabilitiesGuard =
  (capabilityChecker: (authService: AuthService) => boolean): CanActivateFn =>
  () => {
    const authService = inject(AuthService);

    if (capabilityChecker(authService)) {
      return true;
    }

    const router = inject(Router);
    return router.navigate(['/']);
  };
