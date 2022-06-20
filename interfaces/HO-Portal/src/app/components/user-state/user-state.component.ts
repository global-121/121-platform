import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import Permission from 'src/app/auth/permission.enum';
import { User } from 'src/app/models/user.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-user-state',
  templateUrl: './user-state.component.html',
  styleUrls: ['./user-state.component.scss'],
})
export class UserStateComponent implements OnInit {
  public isDebug = !environment.production;
  public userName: string;
  public permissions: Permission[];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.authenticationState$.subscribe((user: User | null) => {
      this.userName = user && user.username ? user.username : '';
      if (this.isDebug) {
        this.permissions =
          user && user.permissions ? user.permissions.sort() : [];
      }
    });
  }

  public async doLogout() {
    await this.authService.logout();
    window.location.reload();
  }

  public debugShowPermissions() {
    let allPermissions = 'UserState: All User Permissions:\n\n';
    this.permissions.forEach((p) => {
      allPermissions += `${p}\n`;
    });
    allPermissions += `\n${this.permissions.length} permissons in total`;
    // tslint:disable:no-console
    console.info(allPermissions);
    window.alert(allPermissions);
  }
}
