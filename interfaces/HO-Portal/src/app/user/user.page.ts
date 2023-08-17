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
  public isError: boolean = false;

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

  private userName: string;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.authenticationState$.subscribe((user: User | null) => {
      this.userName = user && user.username ? user.username : '';
    });
  }

  public async updatePassword() {
    if (!this.newPasswordForm.form.valid) {
    }
    try {
      await this.authService.setPassword(
        this.userName,
        this.password,
        this.newPassword,
      );
      this.passwordChanged = true;
      this.newPasswordForm.resetForm();
      window.setTimeout(() => {
        this.passwordChanged = false;
      }, 3000);
    } catch (error) {
      console.error('An error occurred while updating password: ', error);
      this.isError = true;
    }
  }

  // public async updatePassword() {
  //   try {
  //     if (!this.newPasswordForm.form.valid) {
  //       return;
  //     }

  //     await this.authService.setPassword(
  //       this.userName,
  //       this.password,
  //       this.newPassword,
  //     );

  //     this.passwordChanged = true;
  //     this.newPasswordForm.resetForm();
  //     window.setTimeout(() => {
  //       this.passwordChanged = false;
  //     }, 3000);
  //   } catch (error) {
  //     console.error('An error occurred while updating password: ', error);
  //     this.isError = true;
  //   }
  // }

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

  public onPasswordBlur() {
    this.checkEmptyPassword();
  }

  private checkEmptyPassword() {
    this.emptyPassword = this.password === '';
  }
}
