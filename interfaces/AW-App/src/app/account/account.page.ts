import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../auth/auth.service';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';

@Component({
  selector: 'app-account',
  templateUrl: 'account.page.html',
  styleUrls: ['account.page.scss'],
})
export class AccountPage {
  public isLoggedIn: boolean;
  public changePasswordForm = false;

  private readonly urlValidationPage = '/tabs/validation';

  constructor(
    private authService: AuthService,
    public translate: TranslateService,
    public programsService: ProgramsServiceApiService,
    private router: Router,
    public toastController: ToastController,
  ) {}

  ngOnInit() {
    this.authService.authenticationState$.subscribe((state) => {
      this.isLoggedIn = !!state;
    });
  }

  public async doLogin(event) {
    console.log('doLogin()');

    event.preventDefault();

    this.authService
      .login(
        event.target.elements.email.value,
        event.target.elements.password.value,
      )
      .then(
        () => {
          this.createToast(this.translate.instant('account.logged-in'));
          this.router.navigate([this.urlValidationPage]);
        },
        (error) => {
          if (error.status && error.status === 401) {
            this.createToast(
              this.translate.instant('account.wrong-credentials'),
            );
            return;
          }
          this.createToast(this.translate.instant('account.no-connection'));
        },
      );
  }

  public async logout() {
    this.authService.logout();
    this.changePasswordForm = false;
    this.createToast(this.translate.instant('account.logged-out'));
  }

  public async openChangePassword() {
    this.changePasswordForm = true;
  }

  public async closeChangePassword() {
    this.changePasswordForm = false;
  }

  createToast(message) {
    this.toastController
      .create({
        header: message,
        animated: true,
        cssClass: 'update-toast',
        duration: 3000,
        position: 'bottom',
        buttons: [
          {
            side: 'start',
            icon: 'arrow-redo',
            handler: () => {
              this.router.navigate([this.urlValidationPage]);
            },
          },
          {
            side: 'end',
            role: 'cancel',
            text: this.translate.instant('shared.close'),
          },
        ],
      })
      .then((obj) => {
        obj.present();
      });
  }

  public async doChangePassword(event) {
    const create = event.target.elements.create.value;
    const confirm = event.target.elements.confirm.value;
    if (create === confirm) {
      this.programsService.changePassword(create).then((response) => {
        console.log('Password changed succesfully', response);
        this.changePasswordForm = false;
        this.createToast(this.translate.instant('account.changed-password'));
      });
    } else {
      this.createToast(this.translate.instant('account.unequal-passwords'));
    }
  }
}
