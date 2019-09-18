import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';
import { PaAccountApiService } from 'src/app/services/pa-account-api.service';
import { UserImsApiService } from 'src/app/services/user-ims-api.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-create-password',
  templateUrl: './create-password.component.html',
  styleUrls: ['./create-password.component.scss'],
})
export class CreatePasswordComponent extends PersonalComponent {
  public initialInput = false;
  public create: any;
  public confirm: any;

  public isInProgress = false;

  constructor(
    public conversationService: ConversationService,
    public paAccountApiService: PaAccountApiService,
    public userImsApiService: UserImsApiService,
    public programsServiceApiService: ProgramsServiceApiService,
    public storage: Storage,
    public storageService: StorageService
  ) {
    super();
  }

  ngOnInit() {
  }

  public async submitPassword(create: string, confirm: string) {
    console.log('submitPassword()', create, confirm);

    if (create !== confirm) {
      return;
    }

    this.isInProgress = true;

    await this.executeSovrinFlow(create);

    this.complete();
  }

  async executeSovrinFlow(password) {

    // 1. Create PA-account using supplied password + random username
    const paAccountUsername = this.makeRandomUsername(16);
    const paAccountPassword = password;
    await this.storageService.create(paAccountUsername, paAccountPassword);

    // 2. Create (random) wallet-name and store in PA-account
    const paWalletName = this.makeRandomUsername(16);

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

    // 6. Get connection-request (NOTE: in the MVP-setup this is not actually needed/used,
    // because of lack of pairwise connection + encryption)
    const connectionRequest = this.getConnectionRequest();

    // 7. Post connection-response
    const connectionResponse = {
      did,
      verkey: 'verkey:sample',
      nonce: '123456789',
      meta: 'meta:sample'
    };
    this.postConnectionResponse(connectionResponse);

    // 8. Store relevant data in PA-account
    // this.paStoreData('walletName', paWalletName);
    this.storageService.store(this.storageService.type.wallet, JSON.stringify(wallet));
    this.storageService.store(this.storageService.type.correlation, JSON.stringify(correlation));
    this.storageService.store(this.storageService.type.didShort, didShort);
    this.storageService.store(this.storageService.type.did, did);

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


  async sovrinCreateWallet(wallet: any, correlation: any): Promise<void> {
    await this.userImsApiService.createWallet(
      JSON.parse(JSON.stringify(wallet)),
      JSON.parse(JSON.stringify(correlation))
    ).toPromise();
  }

  // Create DID and store in wallet
  async sovrinCreateStoreDid(wallet: any, correlation: any): Promise<any> {
    return await this.userImsApiService.createStoreDid(
      JSON.parse(JSON.stringify(wallet)),
      JSON.parse(JSON.stringify(correlation))
    ).toPromise();
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
    return PersonalComponents.createIdentity;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.createPassword,
      data: {
        password: this.create,
      },
      next: this.getNextSection(),
    });
  }
}
