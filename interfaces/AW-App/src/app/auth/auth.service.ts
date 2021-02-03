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
  private loggedIn = false;
  private userRoles: UserRole[];

  // store the URL so we can redirect after logging in
  redirectUrl: string;

  private authenticationState = new BehaviorSubject<User | null>(null);
  public authenticationState$ = this.authenticationState.asObservable();

  constructor(
    public programsService: ProgramsServiceApiService,
    private jwtService: JwtService,
    private router: Router,
  ) {
    this.checkLoggedInState();
  }

  checkLoggedInState() {
    const user = this.getUserFromToken();

    this.authenticationState.next(user);
  }

  public isLoggedIn(): boolean {
    this.loggedIn = this.getUserFromToken() !== null;

    return this.loggedIn;
  }

  public getUserRoles(): UserRole[] {
    if (!this.userRoles) {
      const user = this.getUserFromToken();

      this.userRoles = user ? user.roles : [];
    }

    return this.userRoles;
  }

  private getUserFromToken(): User | null {
    const rawToken = this.jwtService.getToken();

    if (!rawToken) {
      return null;
    }

    const decodedToken = this.jwtService.decodeToken(rawToken);

    if (!decodedToken.email || !decodedToken.roles) {
      return null;
    }

    return {
      token: rawToken,
      email: decodedToken.email,
      roles: decodedToken.roles,
    };
  }

  private isAllowedUser(user: User) {
    return user.roles && user.roles.includes(UserRole.FieldValidation);
  }

  public async login(email: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.programsService.login(email, password).then(
        (response) => {
          const user = response.user;

          this.authenticationState.next(user);

          if (!user || !user.token) {
            return;
          }

          if (!this.isAllowedUser(user)) {
            return;
          }

          this.jwtService.saveToken(user.token);
          this.loggedIn = true;
          this.userRoles = user.roles;

          if (this.redirectUrl) {
            this.router.navigate([this.redirectUrl]);
            this.redirectUrl = null;
            return;
          }

          return resolve();
        },
        (error) => {
          console.log('AuthService error: ', error);
          return reject(error);
        },
      );
    });
  }

  public logout() {
    this.jwtService.destroyToken();
    this.loggedIn = false;
    this.authenticationState.next(null);
    this.router.navigate(['/tabs/account']);
  }
}
