import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage {
  @ViewChild('newPasswordForm')
  public newPasswordForm: NgForm;

  public newPassword = '';
  public confirmPassword = '';
  public passwordChanged = false;

  public minLength = 8;

  private borderValues = {
    normal: '',
    valid: 'valid-border',
    invalid: 'invalid-border',
  };

  public validPassword = true;
  public newPasswordBorder = this.borderValues.normal;
  public samePassword = true;
  public confirmPasswordBorder = this.borderValues.normal;

  constructor(private authService: AuthService) {}

  public updatePassword() {
    if (!this.newPasswordForm.form.valid) {
      return;
    }

    this.authService.setPassword(this.newPassword).then(() => {
      this.passwordChanged = true;
      this.newPasswordForm.resetForm();
      window.setTimeout(() => {
        this.passwordChanged = false;
      }, 3000);
    });
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
