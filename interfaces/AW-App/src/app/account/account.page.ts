import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Events, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../auth/auth.service';
import { ConversationService } from '../services/conversation.service';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';

@Component({
  selector: 'app-account',
  templateUrl: 'account.page.html',
  styleUrls: ['account.page.scss'],
})
export class AccountPage {
  public isLoggedIn: boolean;
  public loggedIn: string;
  public loggedOut: string;
  public wrongCredentials: string;
  public noConnection: string;
  public changePasswordForm = false;
  public changedPassword: string;
  public unequalPasswords: string;

  constructor(
    private authService: AuthService,
    public translate: TranslateService,
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    private router: Router,
    public events: Events,
    public toastController: ToastController,
  ) {}

  ngOnInit() {
    this.changedPassword = this.translate.instant('account.changed-password');
    this.unequalPasswords = this.translate.instant('account.unequal-passwords');
    this.wrongCredentials = this.translate.instant('account.wrong-credentials');
    this.noConnection = this.translate.instant('account.no-connection');
    this.loggedIn = this.translate.instant('account.logged-in');
    this.loggedOut = this.translate.instant('account.logged-out');

    this.isLoggedIn = this.authService.isLoggedIn();
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
        (response) => {
          console.log('LoginPage login:', response);
          this.isLoggedIn = true;
          this.createToast(this.loggedIn);
          this.router.navigate(['/tabs/validation']);
        },
        (error) => {
          console.log('LoginPage error: ', error.status);
          if (error.status === 401) {
            this.createToast(this.wrongCredentials);
          } else {
            this.createToast(this.noConnection);
          }
        },
      );
  }

  public async logout() {
    this.programsService.logout();
    this.isLoggedIn = false;
    this.changePasswordForm = false;
    this.createToast(this.loggedOut);
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
        showCloseButton: true,
        closeButtonText: 'Close',
        cssClass: 'update-toast',
        duration: 3000,
        position: 'bottom',
        buttons: [
          {
            side: 'start',
            icon: 'share-alt',
            handler: () => {
              this.router.navigate(['tabs/validation']);
            },
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
        this.createToast(this.changedPassword);
      });
    } else {
      this.createToast(this.unequalPasswords);
    }
  }
}
