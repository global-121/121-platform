import { Component, OnInit } from '@angular/core';
import {
  AlertController,
  LoadingController,
  ModalController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import {
  LoggingEvent,
  LoggingEventCategory,
} from 'src/app/models/logging-event.enum';
import { LoggingService } from 'src/app/services/logging.service';
import { PaDataService } from 'src/app/services/padata.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent implements OnInit {
  public isLoggedIn = false;
  public username: string;
  private deletePasswordAlert: HTMLIonAlertElement;
  private loadingDelete: HTMLIonLoadingElement;

  constructor(
    private modalController: ModalController,
    private paData: PaDataService,
    private translate: TranslateService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private logger: LoggingService,
  ) {}

  async ngOnInit() {
    this.isLoggedIn = this.paData.hasAccount;
    this.username = await this.paData.getUsername();
  }

  close() {
    this.modalController.dismiss();
  }

  logout() {
    this.paData.logout();
    this.close();
    this.logger.logEvent(LoggingEventCategory.ui, LoggingEvent.logout);
    window.location.reload();
  }

  async deletePrompt() {
    this.deletePasswordAlert = await this.alertController.create({
      header: this.translate.instant('account.delete-account-header'),
      message: this.translate.instant('account.delete-account-message'),
      inputs: [
        {
          name: 'password',
          type: 'password',
          placeholder: this.translate.instant('account.enter-password'),
        },
      ],
      buttons: [
        {
          role: 'cancel',
          text: this.translate.instant('shared.cancel-button'),
        },
        {
          text: this.translate.instant('shared.submit-button'),
          handler: (data) => {
            if (!data || !data.password) {
              const passwordInput: HTMLInputElement = this.deletePasswordAlert.querySelector(
                '[type=password]',
              );
              passwordInput.focus();

              return false;
            }

            this.presentLoadingDelete();
            this.deleteIdentity(data.password);

            return false;
          },
        },
      ],
    });
    await this.deletePasswordAlert.present().then(() => {
      const passwordInput: HTMLInputElement = this.deletePasswordAlert.querySelector(
        '[type=password]',
      );
      passwordInput.addEventListener('keypress', (event: KeyboardEvent) => {
        if (event.key !== 'Enter' || !passwordInput.value) {
          return false;
        }
        this.presentLoadingDelete();
        this.deleteIdentity(passwordInput.value);
      });
      passwordInput.focus();
    });
  }

  private deleteIdentity(password: string) {
    return this.paData.deleteIdentity(password).then(
      () => {
        this.loadingDelete.dismiss();
        this.deletePasswordAlert.dismiss();
        this.showDeleteResult(
          this.translate.instant('account.delete-success'),
          true,
        );
        this.logger.logEvent(
          LoggingEventCategory.ui,
          LoggingEvent.accountDeleteSucces,
        );
      },
      (error) => {
        this.loadingDelete.dismiss();
        if (error.status === 401) {
          console.error('Incorrect credentials: ', error);
          this.showDeleteResult(
            this.translate.instant(
              'personal.login-identity.incorrect-credentials',
            ),
          );
        } else if (error.status === 400) {
          console.error('Account already deleted ', error);
          this.showDeleteResult(
            this.translate.instant('account.delete-success'),
          );
        } else {
          console.error(error);
          this.showDeleteResult(this.translate.instant('account.delete-fail'));
        }
        this.logger.logEvent(
          LoggingEventCategory.ui,
          LoggingEvent.accountDeleteFail,
          {
            name: error.status,
          },
        );
      },
    );
  }

  public async presentLoadingDelete() {
    this.loadingDelete = await this.loadingController.create({});
    await this.loadingDelete.present();
  }

  public async showDeleteResult(
    resultMessage: string,
    logoutOnDismiss = false,
  ) {
    const alert = await this.alertController.create({
      message: resultMessage,
      buttons: [
        {
          text: this.translate.instant('shared.close-button'),
        },
      ],
    });

    if (logoutOnDismiss) {
      alert.onDidDismiss().then(() => this.logout());
    }

    await alert.present();
  }
}
