import { Component, Input } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';

@Component({
  selector: 'app-login-identity',
  templateUrl: './login-identity.component.html',
  styleUrls: ['./login-identity.component.scss'],
})
export class LoginIdentityComponent extends PersonalComponent {
  @Input()
  public data: any;

  public initialInput = false;
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

  ngOnInit() {
    if (this.data) {
      this.initHistory();
    }
  }

  initHistory() {
    this.isDisabled = true;
    this.username = this.data.username;
    this.password = this.data.password;
    this.usernameSubmitted = true;
  }

  public async submitLoginCredentials(username: string, password: string) {
    console.log('submitCredentials()', username, password);

    this.conversationService.startLoading();

    await this.paData.login(username, password).then(
      () => {
        this.incorrectCredentials = false;
        this.isInProgress = true;
        this.isDisabled = true;
        this.complete();
        this.conversationService.restoreAfterLogin();
      },
      (error) => {
        this.conversationService.stopLoading();

        if (error.status === 401) {
          this.incorrectCredentials = true;
          console.log('Incorrect credentials: ', error.status);
        } else {
          console.log('Other error: ', error.status);
        }
      }
    );

  }

  getNextSection() {
    // The next-section will be defined by the retrieved conversationHistory, not here.
    return '';
  }

  complete() {
    // This section doesn't really need to 'completed', as it will be replaced by the state from history.
  }
}
