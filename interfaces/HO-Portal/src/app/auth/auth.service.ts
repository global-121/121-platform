import { Injectable } from '@angular/core';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { JwtService } from '../services/jwt.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { UserRole } from './user-role.enum';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedIn = false;
  private userRole: UserRole | string;

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

  public getUserRole(): UserRole | string {
    if (!this.userRole) {
      const user = this.getUserFromToken();

      this.userRole = user ? user.role : '';
    }

    return this.userRole;
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
      role: decodedToken.role,
    };

    this.userRole = user.role;

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

        if (user.role === UserRole.Aidworker) {
          return;
        }

        this.jwtService.saveToken(user.token);
        this.loggedIn = true;
        this.userRole = user.role;

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
