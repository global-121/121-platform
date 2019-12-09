import { ProgramsServiceApiService } from './../services/programs-service-api.service';
import { Component, OnInit, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { PaDataService } from 'src/app/services/padata.service';
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';
import { SovrinService } from '../services/sovrin.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {
  @Input()
  public data: any;

  public isLoggedIn = false;

  constructor(
    private popoverController: PopoverController,
    private paData: PaDataService,
    public sovrinService: SovrinService,
    public programService: ProgramsServiceApiService,
    public translate: TranslateService,
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
    const alert = await this.alertController.create({
      header: this.translate.instant('account.delete-account-id'),
      inputs: [
        {
          name: 'password',
          type: 'text',
          placeholder: this.translate.instant('account.enter-password')
        },
      ],
      buttons: [
        {
          text: this.translate.instant('shared.submit-button'),
          handler: async data => {
            console.log('Confirm Ok');
            await this.deleteAccountId(data.password);
          },
        },
        {
          text: this.translate.instant('account.close'),
          handler: () => {
            this.alertController.dismiss();
          }
        }
      ]
    });
    await alert.present();
  }

  public async deleteAccountId(password: string) {
    console.log('password', password);
    const wallet = await this.paData.retrieve(this.paData.type.wallet);
    const did = await this.paData.retrieve(this.paData.type.did);
    await this.paData.deleteAccount(password).then(
      async () => {
        console.log('Delete wallet', wallet);
        await this.deleteWallet(wallet);
        await this.deleteDidConnection(did);
        this.logout();
      },
      (error) => {
        if (error.status === 401) {
          // TODO: show feedback to user here
          console.log('Incorrect credentials: ', error.status);
        } else if (error.status === 400) {
          console.log('Account already deleted ', error.status, error);
        }
      }
    );
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
}
