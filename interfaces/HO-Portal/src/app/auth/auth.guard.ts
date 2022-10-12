import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AppRoutes } from '../app-routes.enum';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    nextRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    // If no specific permission is required, only require a valid login
    if (!nextRoute.data.permissions && this.authService.isLoggedIn()) {
      return true;
    }

    if (
      nextRoute.params.id &&
      nextRoute.data.permissions &&
      this.authService.hasAllPermissions(
        nextRoute.params.id,
        nextRoute.data.permissions,
      )
    ) {
      return true;
    }

    // Store the attempted URL for redirecting
    this.authService.redirectUrl = state.url;
    this.router.navigate(['/', AppRoutes.login]);
    return false;
  }
}
