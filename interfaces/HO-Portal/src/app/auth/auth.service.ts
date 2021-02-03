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
  private userRoles: UserRole[] | string[];

  // store the URL so we can redirect after logging in
  redirectUrl: string;

  private authenticationState = new BehaviorSubject<User | null>(null);
  public authenticationState$ = this.authenticationState.asObservable();

  constructor(
    private programsService: ProgramsServiceApiService,
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

  public getUserRoles(): UserRole[] | string[] {
    if (!this.userRoles) {
      const user = this.getUserFromToken();

      this.userRoles = user ? user.roles : [];
    }
    return this.userRoles;
  }

  private getUserFromToken() {
    const rawToken = this.jwtService.getToken();

    if (!rawToken) {
      return null;
    }

    const decodedToken = this.jwtService.decodeToken(rawToken);
    const user: User = {
      token: rawToken,
      email: decodedToken.email,
      roles: decodedToken.roles,
    };

    this.userRoles = user.roles.map((role) => role.role);

    return user;
  }

  public async login(email: string, password: string) {
    return this.programsService.login(email, password).subscribe(
      (response) => {
        const user = response.user;

        this.authenticationState.next(user);

        if (!user || !user.token) {
          return;
        }

        if (user.role === [UserRole.FieldValidation]) {
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

        this.router.navigate(['/home']);
      },
      (error) => {
        console.log('AuthService error: ', error);
      },
    );
  }

  public logout() {
    this.jwtService.destroyToken();
    this.loggedIn = false;
    this.authenticationState.next(null);
    this.router.navigate(['/login']);
  }
}
