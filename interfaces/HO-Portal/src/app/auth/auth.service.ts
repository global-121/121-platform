import { Injectable } from '@angular/core';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn = false;

  // store the URL so we can redirect after logging in
  redirectUrl: string;

  constructor(
    public programsService: ProgramsServiceApiService,
    private router: Router
  ) { }

  public async login(event) {
    event.preventDefault();

    this.programsService.login(
      event.target.elements.email.value,
      event.target.elements.password.value
    ).subscribe(
      (response) => {
        this.isLoggedIn = true;
        if (this.redirectUrl) {
          this.router.navigate([this.redirectUrl]);
          this.redirectUrl = null;
        } else {
          this.router.navigate(['/home']);
        }
      },
      (error) => {
        console.log('LoginPage error: ', error);
      }
    );
  }
}
