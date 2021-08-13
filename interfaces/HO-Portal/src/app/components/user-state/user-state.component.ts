import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-user-state',
  templateUrl: './user-state.component.html',
  styleUrls: ['./user-state.component.scss'],
})
export class UserStateComponent implements OnInit {
  public userName: string;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.authenticationState$.subscribe((user: User | null) => {
      this.userName = user && user.username ? user.username : '';
    });
  }

  public doLogout() {
    this.authService.logout();
    window.location.reload();
  }
}
