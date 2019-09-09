import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';

import { ConversationService } from 'src/app/services/conversation.service';
import { PaAccountApiService } from 'src/app/services/pa-account-api.service';
import { UserImsApiService } from 'src/app/services/user-ims-api.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

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
  private wallet: any;
  private correlation: any;

  constructor(
    public conversationService: ConversationService,
    public paAccountApiService: PaAccountApiService,
    public userImsApiService: UserImsApiService,
    public programsServiceApiService: ProgramsServiceApiService,
  ) { }

  ngOnInit() {
  }

  public async submitPassword(create: string, confirm: string) {
    console.log('submitPassword()', create, confirm);

    if (create !== confirm) {
      return;
    }

    this.sovrinSetup(create);

    this.passwordCreated = true;

    this.complete();
  }

  async sovrinSetup(password) {

    // 1. Create PA-account using supplied password + random username
    const paAccountUsername = this.makeRandomUsername(16);
    const paAccountPassword = password;
    this.paCreateAccount(paAccountUsername, paAccountPassword);

    // 2. Create (random) wallet-name and store in PA-account
    const paWalletName = this.makeRandomUsername(16);
    this.paStoreWalletName(paAccountUsername, paWalletName);

    // 3. Create Sovrin wallet using previously created wallet-name and wallet-password equal to account-password
    const wallet = {
      id: paWalletName,
      passKey: paAccountPassword,
    };
    const correlation = {
      correlationID: 'test'
    };
    await this.sovrinCreateWallet(wallet, correlation);

    // 4. Generate Sovrin DID and store in wallet
    const result = await this.sovrinCreateStoreDid(wallet, correlation);

    // 5. Store Sovrin DID in PA-account
    const didShort = result.did;
    const did = 'did:sov:' + didShort;
    this.storeDid(paAccountUsername, did);

    // Get connection-request (NOTE: in the MVP-setup this is not actually needed/used, because of lack of pairwise connection + encryption)
    const connectionRequest = this.getConnectionRequest();

    // Post connection-response
    const connectionResponse = {
      did: did,
      verkey: 'verkey:sample',
      nonce: '123456789',
      meta: 'meta:sample'
    };
    this.postConnectionResponse(connectionResponse);




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

  paCreateAccount(paAccountUsername, paAccountPassword) {
    this.paAccountApiService.create(paAccountUsername, paAccountPassword).subscribe((response) => {
      console.log('response: ', response);
    });
  }

  paStoreWalletName(paAccountUsername, paWalletName) {
    this.paAccountApiService.store(paAccountUsername, 'walletName', paWalletName).subscribe((response) => {
      console.log('response: ', response);
    });
  }

  async sovrinCreateWallet(wallet: any, correlation: any): Promise<void> {
    await this.userImsApiService.createWallet(
      JSON.parse(JSON.stringify(wallet)),
      JSON.parse(JSON.stringify(correlation))
    ).toPromise();
    // .subscribe((response) => {
    //   console.log('response: ', response);
    // });
  }

  // Create DID and store in wallet
  async sovrinCreateStoreDid(wallet: any, correlation: any): Promise<any> {
    return await this.userImsApiService.createStoreDid(
      JSON.parse(JSON.stringify(wallet)),
      JSON.parse(JSON.stringify(correlation))
    ).toPromise();
    // .subscribe((response2) => {
    //   console.log('response: ', response2);
    //   this.did = response2.did;
    // });
  }

  storeDid(paAccountUsername, did) {
    this.paAccountApiService.store(paAccountUsername, 'did', did).subscribe((response) => {
      console.log('response: ', response);
    });
  }

  getConnectionRequest() {
    this.programsServiceApiService.getConnectionRequest().subscribe((response) => {
      console.log('response: ', response);
    });
  }

  postConnectionResponse(connectionReponse: any) {
    this.programsServiceApiService.postConnectionResponse(
      connectionReponse.did,
      connectionReponse.verkey,
      connectionReponse.nonce,
      connectionReponse.meta
    ).subscribe((response) => {
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
