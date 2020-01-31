import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const url: string = state.url;
    const currentUserRole = this.authService.getUserRole();
    console.log('currentUserRole: ', currentUserRole);

    return this.checkLogin(url, currentUserRole, next);
  }

  checkLogin(url: string, currentUserRole: string, route: ActivatedRouteSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      if (!route.data.roles) {
        return true;
      }
      if (route.data.roles.includes(currentUserRole)) {
        return true;
      }
    }
    // Store the attempted URL for redirecting
    this.authService.redirectUrl = url;
    this.router.navigate(['/login']);
    return false;
  }

}
