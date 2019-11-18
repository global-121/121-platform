import { Component, Input } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { ConversationService } from 'src/app/services/conversation.service';
import { PaDataService } from 'src/app/services/padata.service';
import { PersonalComponents } from '../personal-components.enum';

@Component({
  selector: 'app-login-identity',
  templateUrl: './login-identity.component.html',
  styleUrls: ['./login-identity.component.scss'],
})
export class LoginIdentityComponent extends PersonalComponent {
  @Input()
  public data;

  public initialInput = false;
  public usernameSubmitted = false;
  public username: string;
  public password: any;
  public incorrectCredentials = false;

  public isInProgress = false;

  constructor(
    public conversationService: ConversationService,
    public paData: PaDataService,
  ) {
    super();
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

    await this.paData.login(username, password).then(
      async () => {
        this.incorrectCredentials = false;
        this.isInProgress = true;
        this.conversationService.startLoading();
        // Here goes something that retrieves up-to-date conversation-history??
        this.paData.setLoggedIn();
        this.conversationService.stopLoading();
        this.complete();
      },
      (error) => {
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
    // Here goes something that you move to end of up-to-date conversation history??
    return PersonalComponents.initialNeeds;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.loginIdentity,
      data: {
        username: this.username,
        password: '****************',
      },
      next: this.getNextSection(),
    });
  }
}
