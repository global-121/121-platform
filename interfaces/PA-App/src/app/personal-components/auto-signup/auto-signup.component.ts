import { Component, Input } from '@angular/core';
import { createRandomString } from 'src/app/helpers/createRandomString';
import {
  LoggingEvent,
  LoggingEventCategory,
} from 'src/app/models/logging-event.enum';
import { PersonalDirective } from 'src/app/personal-components/personal-component.class';
import { PersonalComponents } from 'src/app/personal-components/personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { LoggingService } from 'src/app/services/logging.service';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-auto-signup',
  templateUrl: './auto-signup.component.html',
  styleUrls: ['./auto-signup.component.scss'],
})
export class AutoSignupComponent extends PersonalDirective {
  @Input()
  public data: any;

  constructor(
    public conversationService: ConversationService,
    public paData: PaDataService,
    public programsServiceApiService: ProgramsServiceApiService,
    private logger: LoggingService,
  ) {
    super();
  }

  ngOnInit() {
    if (this.data) {
      return;
    }

    this.initNew();
  }

  initNew() {
    this.signup();
  }

  private async signup() {
    const username = createRandomString(8);
    const password = createRandomString(8);

    await this.paData.createAccount(username, password).then(
      async (response) => {
        console.log('createAccount', response);
        await this.createRegistration();
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
          this.logger.logEvent(
            LoggingEventCategory.error,
            LoggingEvent.usernameNotUnique,
          );
        }
        console.warn('AutoSignup Error: ', error);
      },
    );
  }

  async createRegistration() {
    const referenceId =
      createRandomString(8) +
      '-' +
      createRandomString(4) +
      '-' +
      createRandomString(4) +
      '-' +
      createRandomString(4) +
      '-' +
      createRandomString(12);

    const currentProgram = await this.paData.getCurrentProgram();

    await this.programsServiceApiService.createRegistration(
      referenceId,
      currentProgram.id,
    );

    await this.paData.store(this.paData.type.referenceId, referenceId);
  }

  getNextSection() {
    return PersonalComponents.enrollInProgram;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.autoSignup,
      data: {
        registrationComplete: true,
      },
      next: this.getNextSection(),
    });
  }
}
