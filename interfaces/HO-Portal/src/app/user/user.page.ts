import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.page.html',
  styleUrls: ['./user.page.scss'],
})
export class UserPage implements OnInit {
  @ViewChild('newPasswordForm', { static: false })
  public newPasswordForm: NgForm;

  public newPassword: any;
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
}
