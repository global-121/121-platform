import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { JwtService } from '../services/jwt.service';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import Permission from './permission.enum';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public redirectUrl: string;

  private authenticationState = new BehaviorSubject<User | null>(null);
  public authenticationState$ = this.authenticationState.asObservable();

  constructor(
    private programsService: ProgramsServiceApiService,
    private jwtService: JwtService,
    private router: Router,
  ) {
    this.checkAuthenticationState();
  }

  checkAuthenticationState() {
    const user = this.getUserFromToken();

    this.authenticationState.next(user);
  }

  public isLoggedIn(): boolean {
    return this.getUserFromToken() !== null;
  }

  public hasPermission(requiredPermission: Permission, user?: User): boolean {
    if (!user) {
      user = this.getUserFromToken();
    }
    return user.permissions && user.permissions.includes(requiredPermission);
  }

  public hasAllPermissions(requiredPermissions: Permission[]): boolean {
    const user = this.getUserFromToken();
    return requiredPermissions.every((p) => this.hasPermission(p, user));
  }

  private getUserFromToken(): User | null {
    const rawToken = this.jwtService.getToken();

    if (!rawToken) {
      return null;
    }

    let user: User | any;

    try {
      user = this.jwtService.decodeToken(rawToken);
    } catch {
      console.warn('AuthService: Invalid token');
      return null;
    }

    if (!user || !user.permissions) {
      console.warn('AuthService: No valid user');
      return null;
    }

    return {
      username: user.username,
      permissions: user.permissions,
    };
  }

  public async login(email: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.programsService.login(email, password).then(
        (response) => {
          if (response && response.token) {
            this.jwtService.saveToken(response.token);
          }

          const user = this.getUserFromToken();
          this.authenticationState.next(user);

          if (!user) {
            return reject({ status: 401 });
          }

          if (this.redirectUrl) {
            this.router.navigate([this.redirectUrl]);
            this.redirectUrl = null;
            return;
          }

          return resolve();
        },
        (error) => {
          console.error('AuthService: login error: ', error);
          return reject(error);
        },
      );
    });
  }

  public logout() {
    this.jwtService.destroyToken();
    this.authenticationState.next(null);
  }
}
