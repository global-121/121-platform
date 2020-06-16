import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';

@Component({
  selector: 'app-login-identity',
  templateUrl: './login-identity.component.html',
  styleUrls: ['./login-identity.component.scss'],
})
export class LoginIdentityComponent extends PersonalComponent {
  public usernameSubmitted = false;
  public username: string;
  public password: any;
  public incorrectCredentials = false;

  public isInProgress = false;

  private isLoggedIn = false;

  constructor(
    public conversationService: ConversationService,
    public paData: PaDataService,
  ) {
    super();

    this.paData.authenticationState$.subscribe((authState) => {
      this.isLoggedIn = authState;

      if (this.isLoggedIn) {
        this.isDisabled = true;
      }
    });
  }

  ngOnInit() {}

  public async submitLoginCredentials(username: string, password: string) {
    console.log('submitCredentials()', username, password);

    this.conversationService.startLoading();

    await this.paData.login(username, password).then(
      () => {
        this.incorrectCredentials = false;
        this.isInProgress = true;
        this.complete();
      },
      (error) => {
        this.conversationService.stopLoading();

        if (error.status === 401) {
          this.incorrectCredentials = true;
          console.log('Incorrect credentials: ', error.status);
        } else {
          console.log('Other error: ', error.status);
        }
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
