import { Component } from '@angular/core';
import {
  LoggingEvent,
  LoggingEventCategory,
} from 'src/app/models/logging-event.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { LoggingService } from 'src/app/services/logging.service';
import { PaDataService } from 'src/app/services/padata.service';
import { PersonalDirective } from '../personal-component.class';

@Component({
  selector: 'app-login-account',
  templateUrl: './login-account.component.html',
  styleUrls: ['./login-account.component.scss'],
})
export class LoginAccountComponent extends PersonalDirective {
  public usernameSubmitted = false;
  public username: string;
  public password: any;
  public incorrectCredentials = false;

  public isInProgress = false;

  private isLoggedIn = false;

  constructor(
    public conversationService: ConversationService,
    private paData: PaDataService,
    private logger: LoggingService,
  ) {
    super();

    this.paData.authenticationState$.subscribe((user) => {
      this.isLoggedIn = !!user;

      if (this.isLoggedIn) {
        this.isDisabled = true;
      }
    });
  }

  ngOnInit() {}

  public async submitLoginCredentials(username: string, password: string) {
    this.conversationService.startLoading();

    await this.paData.login(username, password).then(
      () => {
        this.incorrectCredentials = false;
        this.isInProgress = true;
        this.complete();
        this.logger.logEvent(LoggingEventCategory.ui, LoggingEvent.loginSucces);
      },
      (error) => {
        this.conversationService.stopLoading();

        if (error.status === 401) {
          this.incorrectCredentials = true;
          console.log('Incorrect credentials: ', error.status);
        } else {
          console.log('Other error: ', error.status);
        }
        this.logger.logEvent(LoggingEventCategory.ui, LoggingEvent.loginFail, {
          name: error.status,
        });
      },
    );
  }

  getNextSection() {
    // The next-section will be defined by the retrieved conversationHistory, not here.
    return '';
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.restoreAfterLogin();
  }
}
