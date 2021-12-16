import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit {
  @ViewChild('newPasswordForm')
  public newPasswordForm: NgForm;

  public newPassword = '';
  public confirmPassword: any;
  public passwordChanged = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {}

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

  public checkConfirmPasswords() {
    this.confirmPassword !== this.newPassword
      ? this.newPasswordForm.form.setErrors({ differentPasswords: true })
      : this.newPasswordForm.form.setErrors(null);
  }

  private shortPassword(): boolean {
    return this.newPassword.length < 8;
  }

  private passwordEmpty(): boolean {
    return this.newPassword === '';
  }

  public showShowPasswordMessage(): boolean {
    return this.shortPassword() && !this.passwordEmpty();
  }

  public showInvalidPasswordMessage(): boolean {
    return (
      !this.shortPassword() &&
      !this.newPasswordForm?.form?.get('new-password')?.valid
    );
  }
}
