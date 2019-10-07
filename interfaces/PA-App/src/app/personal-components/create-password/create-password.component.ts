import { Component } from '@angular/core';
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
    this.conversationService.startLoading();

    await this.executeSovrinFlow(create);

    this.conversationService.stopLoading();
    this.complete();
  }

  async executeSovrinFlow(password: string) {

    // 1. Create PA-account using supplied password + random username
    const paAccountUsername = this.makeRandomString(16);
    const paAccountPassword = password;
    await this.storageService.createAccount(paAccountUsername, paAccountPassword);

    // 2. Create (random) wallet-name and password and store in PA-account
    const paWalletName = this.makeRandomString(16);
    const paWalletPassword = this.makeRandomString(16);

    // 3. Create Sovrin wallet using previously created wallet-name and wallet-password equal to account-password
    const wallet = {
      id: paWalletName,
      passKey: paWalletPassword,
    };
    await this.sovrinCreateWallet(wallet);

    // 4. Generate Sovrin DID and store in wallet
    const result = await this.sovrinCreateStoreDid(wallet);

    // 5. Store Sovrin DID in PA-account
    const didShort = result.did;
    const did = 'did:sov:' + didShort;

    // 6. Get connection-request (NOTE: in the MVP-setup this is not actually needed/used,
    // because of lack of pairwise connection + encryption)
    const connectionRequest = await this.getConnectionRequest();
    console.log('connectionRequest: ', connectionRequest);

    // 7. Post connection-response
    this.postConnectionResponse({
      did,
      verkey: 'verkey:sample',
      nonce: '123456789',
      meta: 'meta:sample'
    });

    // 8. Store relevant data in PA-account
    this.storageService.store(this.storageService.type.wallet, JSON.stringify(wallet));
    this.storageService.store(this.storageService.type.didShort, didShort);
    this.storageService.store(this.storageService.type.did, did);

  }

  makeRandomString(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  async sovrinCreateWallet(wallet: any): Promise<void> {
    await this.userImsApiService.createWallet(wallet);
  }

  // Create DID and store in wallet
  async sovrinCreateStoreDid(wallet: any): Promise<any> {
    return await this.userImsApiService.createStoreDid(wallet);
  }

  async getConnectionRequest() {
    return await this.programsServiceApiService.getConnectionRequest();
  }

  async postConnectionResponse(connectionReponse: any) {
    return await this.programsServiceApiService.postConnectionResponse(
      connectionReponse.did,
      connectionReponse.verkey,
      connectionReponse.nonce,
      connectionReponse.meta
    );
  }

  getNextSection() {
    return PersonalComponents.selectCountry;
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
