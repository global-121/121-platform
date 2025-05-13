import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AppRoutes } from '~/app.routes';
import { AuthService } from '~/services/auth.service';

export const authGuard: CanActivateFn = (_, state) => {
  const authService = inject(AuthService);

  if (authService.isLoggedIn) {
    return true;
  }

  const router = inject(Router);
  return router.navigate(['/', AppRoutes.login], {
    queryParams: {
      returnUrl: state.url,
    },
    queryParamsHandling: 'merge',
  });
};
