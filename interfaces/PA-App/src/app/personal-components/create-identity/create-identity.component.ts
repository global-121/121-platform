import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';
import { SovrinService } from 'src/app/services/sovrin.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaDataService } from 'src/app/services/padata.service';

import { createRandomString } from 'src/app/helpers/createRandomString';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-create-identity',
  templateUrl: './create-identity.component.html',
  styleUrls: ['./create-identity.component.scss'],
})
export class CreateIdentityComponent extends PersonalComponent {

  private useLocalStorage: boolean;

  public initialInput = false;
  public usernameSubmitted = false;
  public username: string;
  public create: any;
  public confirm: any;
  public unequalPasswords = false;

  public isInProgress = false;

  constructor(
    public conversationService: ConversationService,
    public sovrinService: SovrinService,
    public programsServiceApiService: ProgramsServiceApiService,
    public paData: PaDataService
  ) {
    super();
    // this.useLocalStorage = environment.localStorage;
    this.useLocalStorage = environment.localStorageTest;
  }

  ngOnInit() {
  }

  public async submitCredentials(username: string, create: string, confirm: string) {
    console.log('submitCredentials()', username, create, confirm);

    if (create !== confirm) {
      this.unequalPasswords = true;
      return;
    }

    this.unequalPasswords = false;
    this.isInProgress = true;
    this.conversationService.startLoading();

    await this.executeSovrinFlow(this.username, create);

    this.conversationService.stopLoading();
    this.complete();
  }

  async executeSovrinFlow(username: string, password: string) {

    // 1. Create PA-account using supplied password + random username
    const paAccountUsername = this.useLocalStorage ? createRandomString(42) : username;
    const paAccountPassword = password;
    await this.paData.createAccount(paAccountUsername, paAccountPassword);

    // 2. Create (random) wallet-name and password and store in PA-account
    const paWalletName = createRandomString(42);
    const paWalletPassword = createRandomString(42);

    // 3. Create Sovrin wallet using previously created wallet-name and wallet-password equal to account-password
    const wallet = {
      id: paWalletName,
      passKey: paWalletPassword,
    };
    await this.sovrinService.createWallet(wallet);

    // 4. Generate Sovrin DID and store in wallet
    const result = await this.sovrinService.createStoreDid(wallet);

    // 5. Store Sovrin DID in PA-account
    const didShort = result.did;
    const did = 'did:sov:' + didShort;

    // 6. Get connection-request (NOTE: in the MVP-setup this is not actually needed/used,
    // because of lack of pairwise connection + encryption)
    const connectionRequest = await this.programsServiceApiService.getConnectionRequest();

    // 7. Post connection-response
    this.programsServiceApiService.postConnectionResponse(
      did,
      'verkey:sample',
      connectionRequest.nonce,
      'meta:sample',
    );

    // 8. Store relevant data in PA-account
    this.paData.store(this.paData.type.wallet, wallet);
    this.paData.store(this.paData.type.didShort, didShort);
    this.paData.store(this.paData.type.did, did);

  }

  getNextSection() {
    return PersonalComponents.selectCountry;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.createIdentity,
      data: {
        password: this.create,
      },
      next: this.getNextSection(),
    });
  }
}
