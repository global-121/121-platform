import { Component } from '@angular/core';

import { AuthService } from './auth/auth.service';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  public isLoggedIn: boolean;
  public currentUserRole: string;

  constructor(
    private authService: AuthService,
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.authService.authenticationState$.subscribe((user: User | null) => {
      this.isLoggedIn = (user) ? !!user.token : false;
      this.currentUserRole = (user) ? user.role : '';
    });
  }

  public logout() {
    this.authService.logout();
    window.location.reload();
  }
}
