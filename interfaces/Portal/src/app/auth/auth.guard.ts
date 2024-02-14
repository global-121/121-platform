import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    nextRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
    ): Observable<boolean> | Promise<boolean> | boolean {
      console.log('nextRoute: ', nextRoute);
      console.log('state: ', state); 
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
    // this.router.navigate(['/', AppRoutes.login]);
    return false;
  }
}
