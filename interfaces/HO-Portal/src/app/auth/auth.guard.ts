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

    if (route.data.roles && this.authService.hasUserRole(route.data.roles)) {
      return true;
    }

    // Store the attempted URL for redirecting
    this.authService.redirectUrl = url;
    this.router.navigate(['/login']);
    return false;
  }
}
