import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit {
  @ViewChild('newPasswordForm')
  public newPasswordForm: NgForm;

  public password = '';
  public newPassword = '';
  public confirmPassword = '';
  public passwordChanged = false;
  public emptyPassword = false;
  public errorStatusCode = 0;
  public showPassCheckFail = false;
  public minLength = 8;

  private borderValues = {
    normal: '',
    valid: 'valid-border',
    invalid: 'invalid-border',
  };

  public validPassword = true;
  public validExistinPassword = true;
  public newPasswordBorder = this.borderValues.normal;
  public samePassword = true;
  public confirmPasswordBorder = this.borderValues.normal;
  public passwordBorder = this.borderValues.normal;

  private userName: string;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.authenticationState$.subscribe((user: User | null) => {
      this.userName = user && user.username ? user.username : '';
    });
  }

  public async updatePassword() {
    console.log('updatePassword: Starting password update process...');

    if (!this.newPasswordForm.form.valid) {
      console.log('updatePassword: Form is not valid. Aborting.');
      return;
    }

    try {
      await this.authService.setPassword(
        this.userName,
        this.password,
        this.newPassword,
      );
      console.log('updatePassword: Password set successfully.');

      this.errorStatusCode = 0;
      this.showPassCheckFail = false;
      this.passwordChanged = true;

      this.newPasswordForm.resetForm();
      window.setTimeout(() => {
        this.passwordChanged = false;
      }, 3000);

      console.log('updatePassword: Password update process completed.');
    } catch (error) {
      console.error(
        'updatePassword: An error occurred while updating password: ',
        error,
      );
      console.log('updatePassword: Error Object:', error);

      this.errorStatusCode = error?.statusCode;
      console.log('updatePassword: Error Status Code:', this.errorStatusCode);

      if (error?.statusCode !== 0) {
        this.showPassCheckFail = true;
        console.log('updatePassword: Setting showPassCheckFail to true.');
      }
    }
  }

  public checkPassword() {
    this.validExistinPassword =
      this.newPasswordForm?.form?.get('current-password')?.valid;
    this.passwordBorder = this.validExistinPassword
      ? this.borderValues.valid
      : this.borderValues.invalid;
  }

  public checkNewPassword() {
    this.validPassword = this.newPasswordForm?.form?.get('new-password')?.valid;
    this.newPasswordBorder = this.validPassword
      ? this.borderValues.valid
      : this.borderValues.invalid;
  }

  public checkConfirmPasswords() {
    if (
      this.confirmPassword !== '' &&
      this.confirmPassword === this.newPassword
    ) {
      this.samePassword = true;
      this.confirmPasswordBorder = this.borderValues.valid;
    } else {
      this.samePassword = false;
      this.confirmPasswordBorder = this.borderValues.invalid;
    }
  }

  public onChange() {
    if (
      this.confirmPassword !== '' &&
      this.confirmPassword === this.newPassword
    ) {
      this.samePassword = true;
      this.confirmPasswordBorder = this.borderValues.valid;
    }
  }
}
