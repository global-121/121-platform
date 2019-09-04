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

  private paAccountUsername: string;
  private paAccountPassword: string;
  private paWalletName: string;
  private did = 'empty';  // Replaced after response from UserIMS create-did call

  constructor(
    public conversationService: ConversationService,
    public paAccountApiService: PaAccountApiService,
    public userImsApiService: UserImsApiService,
  ) { }

  ngOnInit() {
  }

  public async submitPassword(create: string, confirm: string) {
    console.log('submitPassword()', create, confirm);

    if (create !== confirm) {
      return;
    }

    await this.createPaAccount(create);
    await this.storeWalletName(this.paAccountUsername);
    // await this.createWalletDid(this.paWalletName, this.paAccountPassword);
    await this.storeDid(this.paAccountUsername);

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
    this.paAccountUsername = this.makeRandomUsername(16);
    this.paAccountPassword = create;
    this.paAccountApiService.create(this.paAccountUsername, this.paAccountPassword).subscribe((responseCreate) => {
      console.log('response: ', responseCreate);
    });
  }

  storeWalletName(paAccountUsername) {
    this.paWalletName = this.makeRandomUsername(16);
    this.paAccountApiService.store(paAccountUsername, 'walletName', this.paWalletName).subscribe((responseStore) => {
      console.log('response: ', responseStore);
    });
  }


  async createWalletDid(paWalletName, paWalletPassword) {

    // Create input for UserIMS calls
    const wallet = {
      id: paWalletName,
      passKey: paWalletPassword,
    }
    const correlation = {
      correlationID: 'test'
    }

    // Create wallet
    await this.userImsApiService.createWallet(
      JSON.parse(JSON.stringify(wallet)),
      JSON.parse(JSON.stringify(correlation))
    ).subscribe((response) => {
      console.log('response: ', response);
    });

    // Create DID and store in wallet
    await this.userImsApiService.createStoreDid(
      JSON.parse(JSON.stringify(wallet)),
      JSON.parse(JSON.stringify(correlation))
    ).subscribe((response) => {
      console.log('response: ', response);
      this.did = response.did;
    });

  }

  storeDid(paAccountUsername) {
    this.paAccountApiService.store(paAccountUsername, 'did', this.did).subscribe((response) => {
      console.log('response: ', response);
    });
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
