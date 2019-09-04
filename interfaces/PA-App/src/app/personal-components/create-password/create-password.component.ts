import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';

import { ConversationService } from 'src/app/services/conversation.service';
import { PaAccountApiService } from 'src/app/services/pa-account-api.service';
import { UserImsApiService } from 'src/app/services/user-ims-api.service';

@Component({
  selector: 'app-create-password',
  templateUrl: './create-password.component.html',
  styleUrls: ['./create-password.component.scss'],
})
export class CreatePasswordComponent implements PersonalComponent {

  public initialInput = false;
  public create: any;
  public confirm: any;
  public passwordCreated: boolean;

  constructor(
    public conversationService: ConversationService,
    public paAccountApiService: PaAccountApiService,
    public userImsApiService: UserImsApiService,
  ) { }

  ngOnInit() {
  }

  public submitPassword(create: string, confirm: string) {
    console.log('submitPassword()', create, confirm);

    if (create !== confirm) {
      return;
    }

    const paAccount = this.createPaAccount(create);
    const paWalletName = this.storeWalletName(paAccount.paAccountUsername);
    // this.createWallet(paWalletName, paAccount.paAccountPassword);

    this.passwordCreated = true;

    this.complete();
  }

  makeRandomUsername(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  createPaAccount(create) {
    const paAccountUsername = this.makeRandomUsername(16);
    const paAccountPassword = create;
    this.paAccountApiService.create(paAccountUsername, paAccountPassword).subscribe((responseCreate) => {
      console.log('response: ', responseCreate);
    });
    return { paAccountUsername, paAccountPassword };
  }

  storeWalletName(paAccountUsername) {
    const paWalletName = this.makeRandomUsername(16);
    this.paAccountApiService.store(paAccountUsername, 'walletName', paWalletName).subscribe((responseStore) => {
      console.log('response: ', responseStore);
    });
    return paWalletName;
  }


  createWallet(paWalletName, paWalletPassword) {
    const wallet = {
      id: paWalletName,
      passKey: paWalletPassword,
    }
    const correlation = {
      correlationID: 'test'
    }
    this.userImsApiService.createWallet(
      JSON.parse(JSON.stringify(wallet)),
      JSON.parse(JSON.stringify(correlation))
    ).subscribe((responseWallet) => {
      console.log('response: ', responseWallet);
    })
  }

  getNextSection() {
    return 'create-identity-details';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'create-identity-password',
      data: {
        password: this.create,
      },
      next: this.getNextSection(),
    });
  }
}
