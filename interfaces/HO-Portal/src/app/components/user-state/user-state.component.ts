import { Component, OnInit } from '@angular/core';
import { AppRoutes } from 'src/app/app-routes.enum';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/models/user.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-user-state',
  templateUrl: './user-state.component.html',
  styleUrls: ['./user-state.component.scss'],
})
export class UserStateComponent implements OnInit {
  public isDebug = !environment.production;
  public appRoute = AppRoutes;
  public userName: string;
  public permissions: User['permissions'];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.authenticationState$.subscribe((user: User | null) => {
      this.userName = user && user.username ? user.username : '';
      if (this.isDebug) {
        this.permissions = user && user.permissions ? user.permissions : {};
      }
    });
  }

  public async doLogout() {
    await this.authService.logout();
    window.location.reload();
  }

  public debugShowPermissions() {
    let allPermissions = 'UserState: All User Permissions:\n\n';
    Object.keys(this.permissions).forEach((programId) => {
      allPermissions += `${this.permissions[programId].sort().join('\n')}`;
      allPermissions += `\n${this.permissions[programId].length} permissons for program: ${programId}\n\n`;
    });
    // tslint:disable:no-console
    console.info(allPermissions);
    window.alert(allPermissions);
  }
}
