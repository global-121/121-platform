import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { from } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { User } from '../models/user.model';
import { ProgramsServiceApiService } from '../services/programs-service-api.service';

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
  public samePassword = true;
  public confirmPasswordBorder = this.borderValues.normal;
  public newPasswordBorder = this.borderValues.normal;

  private userName: string;

  constructor(
    private authService: AuthService,
    private readonly programsService: ProgramsServiceApiService,
  ) {}

  ngOnInit() {
    this.authService.authenticationState$.subscribe((user: User | null) => {
      this.userName = user && user.username ? user.username : '';
    });
  }

  public updatePassword() {
    console.log('updatePassword: Starting password update process...');

    if (!this.newPasswordForm.form.valid) {
      console.log('updatePassword: Form is not valid. Aborting.');
      return;
    }

    from(
      this.programsService.changePassword(
        this.userName,
        this.password,
        this.newPassword,
      ),
    ).subscribe((val: any) => {
      if (typeof val === 'string' && val.includes('Not authorized')) {
        this.showPassCheckFail = true;
        this.passwordChanged = true;
      } else if (val) {
        this.errorStatusCode = 0;
        this.showPassCheckFail = false;
        this.passwordChanged = true;
        this.showPassCheckFail = false;
        this.newPasswordForm.resetForm();
      }
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

  public onPasswordBlur() {
    this.checkEmptyPassword();
  }

  private checkEmptyPassword() {
    this.emptyPassword = this.password === '';
  }
}
