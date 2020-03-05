import { Component, Input } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';
import { SovrinService } from 'src/app/services/sovrin.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaDataService } from 'src/app/services/padata.service';
import { UiService } from 'src/app/services/ui.service';

import { createRandomString } from 'src/app/helpers/createRandomString';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-create-identity',
  templateUrl: './create-identity.component.html',
  styleUrls: ['./create-identity.component.scss'],
})
export class CreateIdentityComponent extends PersonalComponent {
  @Input()
  public data: any;

  public useLocalStorage: boolean;

  public initialInput = false;
  public usernameSubmitted = false;
  public username: string;
  public create: string;
  public confirm: string;
  public unequalPasswords = false;
  public usernameNotUnique = false;

  public isInProgress = false;
  public createIsValid = true;

  constructor(
    public conversationService: ConversationService,
    public sovrinService: SovrinService,
    public programsServiceApiService: ProgramsServiceApiService,
    public paData: PaDataService,
    public uiService: UiService,
  ) {
    super();
    this.useLocalStorage = environment.localStorage;
  }

  ngOnInit() {
    if (this.data) {
      this.initHistory();
    }
  }

  initHistory() {
    this.isDisabled = true;
    this.username = this.data.username;
    this.create = this.data.password;
    this.confirm = this.data.password;
    this.usernameSubmitted = true;
    this.initialInput = true;

  }

  public async submitCredentials(username: string, create: string, confirm: string) {
    console.log('submitCredentials()', username, create, confirm);

    this.isInProgress = true;

    if (create !== confirm) {
      this.unequalPasswords = true;
      this.isInProgress = false;
      return;
    }
    this.unequalPasswords = false;

    // 1. Create PA-account using supplied password + random username
    // (moved outside of executeSovrinFlow because of unique-username-check)
    const paAccountUsername = this.useLocalStorage ? createRandomString(42) : username;
    const paAccountPassword = create;
    this.conversationService.startLoading();
    await this.paData.createAccount(paAccountUsername, paAccountPassword).then(
      async () => {
        this.usernameNotUnique = false;
        await this.executeSovrinFlow();
        this.uiService.showUserMenu();
        this.conversationService.stopLoading();
        this.complete();
      },
      (error) => {
        this.conversationService.stopLoading();
        if (error.status === 400) {
          this.usernameNotUnique = true;
          this.isInProgress = false;
          console.log('Username is not unique: ', error.status);
        } else {
          console.log('Other error: ', error.status);
        }
      }
    );

  }

  async executeSovrinFlow() {

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
        username: this.username,
        password: '****************',
      },
      next: this.getNextSection(),
    });
  }
}
