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

  checkAuthenticationState() {
    const user = this.getUserFromToken();

    this.authenticationState.next(user);
  }

  public isLoggedIn(): boolean {
    return this.getUserFromToken() !== null;
  }

  private getUserFromToken(): User | null {
    const rawToken = this.jwtService.getToken();

    if (!rawToken) {
      return null;
    }

    let user: User | any;

    try {
      user = this.jwtService.decodeToken(rawToken);

      // Upgrade existing user to new roles
      if (!user.roles && user.role && user.role === 'aidworker') {
        user.roles = [UserRole.FieldValidation];
      }
      // 'Clean' roles-object into flat list of roles
      if (user.roles && user.roles[0] && user.roles[0].role) {
        user.roles = user.roles.map((role) => role.role);
      }
    } catch {
      console.warn('AuthService: Invalid token');
      return null;
    }

    if (!user || !this.isAllowedUser(user)) {
      console.warn('AuthService: No valid user');
      return null;
    }

    return {
      email: user.email,
      roles: user.roles,
    };
  }

  private isAllowedUser(user: User): boolean {
    return user.roles && user.roles.includes(UserRole.FieldValidation);
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
