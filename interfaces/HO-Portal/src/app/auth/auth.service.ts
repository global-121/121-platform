import { Injectable } from '@angular/core';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { JwtService } from '../services/jwt.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = false;
  private userRole: string;

  // store the URL so we can redirect after logging in
  redirectUrl: string;

  private authenticationState = new BehaviorSubject<User|null>(null);
  public authenticationState$ = this.authenticationState.asObservable();

  constructor(
    public programsService: ProgramsServiceApiService,
    private jwtService: JwtService,
    private router: Router
  ) { }

  public isLoggedIn(): boolean {
    if (this.jwtService.getToken()) {
      this.loggedIn = true;
    }

    return this.loggedIn;
  }

  public getUserRole(): string {
    return (!this.userRole) ? this.jwtService.getTokenRole() : this.userRole;
  }

  public async login(email: string, password: string) {
    this.programsService.login(
      email,
      password
    ).subscribe(
      (response) => {
        const user = response.user;

        this.authenticationState.next(user);

        if (!user || !user.token) {
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
      }
    );
  }

  public logout() {
    this.jwtService.destroyToken();
    this.loggedIn = false;
    this.authenticationState.next(null);
    this.router.navigate(['/login']);
  }
}
