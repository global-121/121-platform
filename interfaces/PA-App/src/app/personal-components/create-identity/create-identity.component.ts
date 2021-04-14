import { Component, Input } from '@angular/core';
import { createRandomString } from 'src/app/helpers/createRandomString';
import {
  LoggingEvent,
  LoggingEventCategory,
} from 'src/app/models/logging-event.enum';
import { PersonalComponent } from 'src/app/personal-components/personal-component.class';
import { PersonalComponents } from 'src/app/personal-components/personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { LoggingService } from 'src/app/services/logging.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
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
  public passwordMinLength = 4;

  public initialInput = false;
  public usernameSubmitted = false;
  public username: string;
  public create: string;
  public confirm: string;
  public unequalPasswords = false;
  public usernameNotUnique = false;

  public isInProgress = false;
  public createIsValid: boolean;

  constructor(
    public conversationService: ConversationService,
    public programsServiceApiService: ProgramsServiceApiService,
    public paData: PaDataService,
    private logger: LoggingService,
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

  public async submitCredentials(
    username: string,
    create: string,
    confirm: string,
  ) {
    console.log('submitCredentials()', username, create, confirm);

    // Reset server-side errors, to be sure to only show the first, most relevant error only.
    this.usernameNotUnique = false;
    this.unequalPasswords = false;

    if (!username && !this.useLocalStorage) {
      this.usernameSubmitted = false;
      this.isInProgress = false;
      console.log('No username. ⛔️');
      return;
    }

    this.usernameSubmitted = true;

    if (!create && !confirm) {
      this.isInProgress = false;
      console.log('Username ✅; But no passwords. ⛔️');
      return;
    }

    if (create && !this.createIsValid) {
      this.initialInput = false;
      this.isInProgress = false;
      console.log('Username ✅; First password = Validation error. ⛔️');

      this.logger.logEvent(
        LoggingEventCategory.input,
        LoggingEvent.passwordNotValid,
      );

      return;
    }

    if (create && this.createIsValid && !confirm) {
      this.initialInput = true;
      this.isInProgress = false;
      console.log('Username ✅; First password ✅; No 2nd password. ⛔️');
      return;
    }

    if (create && this.createIsValid && create !== confirm) {
      this.initialInput = true;
      this.unequalPasswords = true;
      this.isInProgress = false;
      console.log(
        'Username ✅; First password ✅; 2nd password ✅; Passwords not equal. ⛔️',
      );

      this.logger.logEvent(
        LoggingEventCategory.input,
        LoggingEvent.passwordNotEqual,
      );

      return;
    }

    this.isInProgress = true;
    this.unequalPasswords = false;

    console.log(
      'Username ✅; First password ✅; 2nd password ✅; Passwords equal ✅; Done! ✅',
    );

    // 1. Create PA-account using supplied password + random username
    // (moved outside of executeSovrinFlow because of unique-username-check)
    const paAccountUsername = this.useLocalStorage
      ? createRandomString(42)
      : username;
    const paAccountPassword = create;
    this.conversationService.startLoading();
    await this.paData.createAccount(paAccountUsername, paAccountPassword).then(
      async () => {
        this.usernameNotUnique = false;
        await this.createConnection();
        this.conversationService.stopLoading();
        this.complete();
        this.logger.logEvent(
          LoggingEventCategory.ui,
          LoggingEvent.accountCreated,
        );
      },
      (error) => {
        this.conversationService.stopLoading();
        if (error.status === 400) {
          this.usernameNotUnique = true;
          this.isInProgress = false;
          this.logger.logEvent(
            LoggingEventCategory.input,
            LoggingEvent.usernameNotUnique,
          );
        }
        console.warn('CreateAccount Error: ', error);
      },
    );
  }

  async createConnection() {
    // Temporatily still create random DID
    const did = 'did:sov:' + createRandomString(22);

    this.programsServiceApiService.createConnection(did);

    this.paData.store(this.paData.type.did, did);
    this.paData.setDid(did);
  }

  getNextSection() {
    return PersonalComponents.enrollInProgram;
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
