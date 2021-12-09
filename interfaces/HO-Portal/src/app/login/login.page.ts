import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LoginPage implements OnInit {
  @ViewChild('loginForm', { static: true })
  public loginForm: NgForm;

  public email: any;
  public password: any;

  constructor(
    private authService: AuthService,
    public toastController: ToastController,
    private translate: TranslateService,
  ) {}
  ngOnInit(): void {
    this.presentToast();
  }

  public async doLogin() {
    console.log('doLogin()');

    if (!this.loginForm.form.valid) {
      return;
    }

    this.authService.login(this.email, this.password).then(() => {
      // Remove credentials from interface-state to prevent re-use after log-out:
      this.loginForm.resetForm();
    });
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: this.translate.instant('page.login.toast-message'),
      cssClass: 'login-notification ion-text-center',
      position: 'top',
      color: 'tertiary',
      buttons: [
        {
          side: 'end',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await toast.present();
  }
}
