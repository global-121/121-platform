import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';
import { CustomTranslateService } from '../services/custom-translate.service';
import { ConversationService } from '../services/conversation.service';

@Component({
  selector: 'app-account',
  templateUrl: 'account.page.html',
  styleUrls: ['account.page.scss']
})
export class AccountPage {
  public emailPlaceholder: string;
  public passwordPlaceholder: string;
  public createPlaceholder: string;
  public confirmPlaceholder: string;
  public isLoggedIn: boolean;
  public wrongCredentials: boolean;
  public noConnection: boolean;
  public changePasswordForm = false;
  public changedPassword: boolean;
  public unequalPasswords: boolean;

  constructor(
    public customTranslateService: CustomTranslateService,
    public programsService: ProgramsServiceApiService,
    public conversationService: ConversationService,
    private router: Router,
  ) { }

  ngOnInit() {
    this.emailPlaceholder = this.customTranslateService.translate('account.email-placeholder');
    this.passwordPlaceholder = this.customTranslateService.translate('account.password-placeholder');
    this.createPlaceholder = this.customTranslateService.translate('account.create-placeholder');
    this.confirmPlaceholder = this.customTranslateService.translate('account.confirm-placeholder');
  }

  public async doLogin(event) {
    console.log('doLogin()');

    event.preventDefault();

    this.programsService.login(
      event.target.elements.email.value,
      event.target.elements.password.value
    ).subscribe(
      (response) => {
        console.log('LoginPage subscribe:', response);

        this.isLoggedIn = true;
        this.wrongCredentials = false;

        this.router.navigate(['/tabs/personal']);

      },
      (error) => {
        console.log('LoginPage error: ', error.status);
        if (error.status === 401) {
          this.wrongCredentials = true;
          this.noConnection = false;
        } else {
          this.wrongCredentials = false;
          this.noConnection = true;
        }
      }
    );
  }

  public async logout() {
    this.programsService.logout();
    this.isLoggedIn = false;
    this.unequalPasswords = false;
    this.changedPassword = false;
    this.changePasswordForm = false;
  }

  public async openChangePassword() {
    this.changePasswordForm = true;
  }

  public async closeChangePassword() {
    this.changePasswordForm = false;
  }

  public async doChangePassword(event) {
    const create = event.target.elements.create.value;
    const confirm = event.target.elements.confirm.value;
    if (create === confirm) {
      this.programsService.changePassword(create).subscribe((response) => {
        console.log('Password changed succesfully');
        this.changePasswordForm = false;
        this.changedPassword = true;
        this.unequalPasswords = false;
      });
    } else {
      this.unequalPasswords = true;
    }
  }

}
