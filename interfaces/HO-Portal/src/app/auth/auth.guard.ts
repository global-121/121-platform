import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    const url: string = state.url;

    return this.checkLogin(url, next);
  }

  checkLogin(url: string, route: ActivatedRouteSnapshot): boolean {
    // If no specific role is required, only require a valid login
    if (!route.data.roles && this.authService.isLoggedIn()) {
      return true;
    }

    // UserRole will only be a valid value, when login is valid
    const currentUserRoles = this.authService.getUserRoles();
    const routeRoles = route.data.roles;

    if (routeRoles) {
      const overlappingRoles = route.data.roles.filter((role) =>
        currentUserRoles.includes(role),
      );
      if (overlappingRoles.length > 0) {
        return true;
      }
    }

    // Store the attempted URL for redirecting
    this.authService.redirectUrl = url;
    this.router.navigate(['/login']);
    return false;
  }
}
