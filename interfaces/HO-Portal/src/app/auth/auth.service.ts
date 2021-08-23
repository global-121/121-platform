import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { JwtService } from '../services/jwt.service';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { UserRole } from './user-role.enum';

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

  private checkAuthenticationState() {
    const user = this.getUserFromToken();

    this.authenticationState.next(user);
  }

  public isLoggedIn(): boolean {
    return this.getUserFromToken() !== null;
  }

  public hasUserRole(requiredRoles: UserRole[]): boolean {
    const user = this.getUserFromToken();

    if (!user || !user.roles) {
      return false;
    }

    return requiredRoles.some((role) => {
      return user.roles.includes(role);
    });
  }

  private getUserFromToken(): User | null {
    const rawToken = this.jwtService.getToken();

    if (!rawToken) {
      return null;
    }

    let user: User;

    try {
      user = this.jwtService.decodeToken(rawToken);

      // Upgrade existing user to new roles
      if (user && user.role && !user.roles) {
        if (user.role === 'aidworker') {
          user.role = UserRole.FieldValidation;
        }
        if (user.role === 'project-officer') {
          user.role = UserRole.RunProgram;
        }
        if (user.role === 'program-manager') {
          user.role = UserRole.PersonalData;
        }
        if (user.role) {
          user.roles = [user.role];
        }
      }
    } catch {
      console.warn('AuthService: Invalid token');
      return null;
    }

    if (
      !user ||
      !user.username ||
      !user.roles ||
      (user.roles.length === 1 && user.roles.includes(UserRole.FieldValidation))
    ) {
      console.warn('AuthService: No valid user');
      return null;
    }

    return {
      username: user.username,
      roles: user.roles,
    };
  }

  public async login(username: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.programsService.login(username, password).then(
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
            return resolve();
          }

          this.router.navigate(['/home']);

          return resolve();
        },
        (error) => {
          console.error('AuthService: login error: ', error);
          return reject(error);
        },
      );
    });
  }

  public async setPassword(newPassword: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.programsService.changePassword(newPassword).then(
        (response) => {
          console.log('AuthService: Password changed!');
          if (response && response.token) {
            this.jwtService.saveToken(response.token);
          }

          const user = this.getUserFromToken();
          this.authenticationState.next(user);

          if (!user) {
            return reject({ status: 401 });
          }

          return resolve();
        },
        (error) => {
          console.error('AuthService: change-password error: ', error);
          return reject(error);
        },
      );
    });
  }

  public logout() {
    this.jwtService.destroyToken();
    this.authenticationState.next(null);
    this.router.navigate(['/login']);
  }
}
