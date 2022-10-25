import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AppRoutes } from '../app-routes.enum';
import { User } from '../models/user.model';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import Permission from './permission.enum';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public redirectUrl: string;
  private userKey = 'logged-in-user-HO';

  private authenticationState = new BehaviorSubject<User | null>(null);
  public authenticationState$ = this.authenticationState.asObservable();

  constructor(
    private programsService: ProgramsServiceApiService,
    private router: Router,
  ) {
    this.checkAuthenticationState();
  }

  private checkAuthenticationState() {
    const user = this.getUserFromStorage();

    this.authenticationState.next(user);
  }

  public isLoggedIn(): boolean {
    return this.getUserFromStorage() !== null;
  }

  private isAssignedToProgram(programId: number, user?: User | null): boolean {
    if (!user) {
      user = this.getUserFromStorage();
    }
    return (
      user &&
      user.permissions &&
      Object.keys(user.permissions).includes(String(programId))
    );
  }

  public hasPermission(
    programId: number,
    requiredPermission: Permission,
    user?: User | null,
  ): boolean {
    if (!user) {
      user = this.getUserFromStorage();
    }
    return (
      user &&
      user.permissions &&
      this.isAssignedToProgram(programId, user) &&
      user.permissions[programId].includes(requiredPermission)
    );
  }

  public hasAllPermissions(
    programId: number,
    requiredPermissions: Permission[],
  ): boolean {
    const user = this.getUserFromStorage();
    return (
      !!programId &&
      !!requiredPermissions &&
      requiredPermissions.every((permissionName) =>
        this.hasPermission(programId, permissionName, user),
      )
    );
  }

  private getUserFromStorage(): User | null {
    const rawUser = localStorage.getItem(this.userKey);

    if (!rawUser) {
      return null;
    }

    let user: User;

    try {
      user = JSON.parse(rawUser);
    } catch {
      console.warn('AuthService: Invalid token');
      return null;
    }
    if (!user || !user.username || !user.permissions) {
      console.warn('AuthService: No valid user');
      return null;
    }
    return {
      username: user.username,
      permissions: user.permissions,
      expires: user.expires,
    };
  }

  public async login(username: string, password: string): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      this.programsService.login(username, password).then(
        (response) => {
          if (response) {
            localStorage.setItem(this.userKey, JSON.stringify(response));
          }

          const user = this.getUserFromStorage();
          this.authenticationState.next(user);

          if (!user) {
            return reject({ status: 401 });
          }

          if (this.redirectUrl) {
            this.router.navigate([this.redirectUrl]);
            this.redirectUrl = null;
            return resolve();
          }

          this.router.navigate(['/', AppRoutes.home]);

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
    return new Promise<void>((resolve, reject) => {
      this.programsService.changePassword(newPassword).then(
        () => {
          return resolve();
        },
        (error) => {
          console.error('AuthService: change-password error: ', error);
          return reject(error);
        },
      );
    });
  }

  public async logout() {
    localStorage.removeItem(this.userKey);
    await this.programsService.logout();

    this.authenticationState.next(null);
    this.router.navigate(['/', AppRoutes.login]);
  }
}
