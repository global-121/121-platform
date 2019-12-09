import { ProgramsServiceApiService } from './../services/programs-service-api.service';
import { Component, OnInit, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { PaDataService } from 'src/app/services/padata.service';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';
import { SovrinService } from '../services/sovrin.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {
  @Input()
  public data: any;

  public isLoggedIn = false;
  public incorrectCredentials = false;
  public deletePasswordAlert;
  public deleteSuccesAlert;

  constructor(
    private popoverController: PopoverController,
    private paData: PaDataService,
    public sovrinService: SovrinService,
    public programService: ProgramsServiceApiService,
    public translate: TranslateService,
    public toastController: ToastController,
    public alertController: AlertController
  ) {
  }

  ngOnInit() {
    if (this.data) {
      this.isLoggedIn = this.data.isLoggedIn;
    }
  }

  close() {
    this.popoverController.dismiss();
  }

  async logout() {
    this.paData.logout();
    this.popoverController.dismiss();
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
          placeholder: this.translate.instant('account.enter-password')
        },
      ],
      buttons: [
        {
          text: this.translate.instant('shared.submit-button'),
          handler: data => {
            console.log('Confirm Ok');
            this.deleteAccountId(data.password);
            return false;
          },
          role: null,
        },
        {
          text: this.translate.instant('account.close'),
          handler: () => {
            this.alertController.dismiss();
          }
        }
      ],
    });
    await this.deletePasswordAlert.present();
  }

  public async passwordIncorrectToast() {
    this.toastController.create({
      header: this.translate.instant('personal.login-identity.incorrect-credentials'),
      animated: true,
      showCloseButton: true,
      closeButtonText: this.translate.instant('account.close'),
      position: 'bottom',
    }).then((obj) => {
      obj.present();
    });
  }

  public async deleteAccountId(password: string): Promise<boolean> {
    const wallet = await this.paData.retrieve(this.paData.type.wallet);
    const did = await this.paData.retrieve(this.paData.type.did);
    await this.paData.deleteAccount(password).then(
      async () => {
        await this.deleteWallet(wallet);
        await this.deleteDidConnection(did);
        this.deletePasswordAlert.dismiss();
        this.deleteSuccesPrompt();
        return true;
      },
      (error) => {
        if (error.status === 401) {
          console.log('Incorrect credentials: ', error.status);
          this.passwordIncorrectToast();
        } else if (error.status === 400) {
          console.log('Account already deleted ', error.status, error);
        }
      }
    );
    return false;
  }

  public async deleteWallet(wallet: any): Promise<any> {
    await this.sovrinService.deleteWallet(wallet).then(
      () => {
        console.log('Deleted wallet');
      },
      (error) => {
        console.log('Error status', error.status, error);
      }
    );
  }

  public async deleteDidConnection(did: string): Promise<any> {
    console.log('deleteDidConnection did: ', did);
    if (did) {
      await this.programService.deleteConnection(did).subscribe(
        () => {
          console.log('Deleted connection info');
        },
        (error) => {
          console.log('Error status', error.status, error);
        }
      );
    }
  }

  public deleteSuccesPrompt() {
    console.log('deleteSuccesPrompt');
    this.alertController.create({
      message: this.translate.instant('account.delete-succes'),
      buttons: [
        {
          text: this.translate.instant('account.close'),
          handler: () => {
            this.logout();
          },
        },
      ],
    }).then((obj) => {
      obj.present();
    });
  }
}
