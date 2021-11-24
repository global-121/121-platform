import { Component, Input } from '@angular/core';
import { InstanceInformation } from 'src/app/models/instance.model';
import { PersonalDirective } from 'src/app/personal-components/personal-component.class';
import { PersonalComponents } from 'src/app/personal-components/personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { InstanceService } from 'src/app/services/instance.service';

export enum ConsentChoices {
  agree = 'agree',
  disagree = 'disagree',
}

@Component({
  selector: 'app-consent-question',
  templateUrl: './consent-question.component.html',
  styleUrls: ['./consent-question.component.scss'],
})
export class ConsentQuestionComponent extends PersonalDirective {
  @Input()
  public data: any;

  public instanceInformation: InstanceInformation;

  public consentChoices = ConsentChoices;
  public consentChoice: ConsentChoices | null;
  public userConsent: boolean;

  constructor(
    public conversationService: ConversationService,
    private instanceService: InstanceService,
  ) {
    super();
  }

  ngOnInit() {
    this.getInstanceInformation();

    if (this.data) {
      this.initHistory();
    }
  }

  initHistory() {
    this.isDisabled = true;
    this.userConsent = this.data.userConsent;
  }

  private async getInstanceInformation() {
    this.instanceService.instanceInformation.subscribe(
      (instanceInformation) => {
        this.instanceInformation = instanceInformation;
      },
    );
  }

  public changeConsent(consentChoice: ConsentChoices) {
    this.consentChoice = consentChoice;
    this.userConsent = consentChoice === ConsentChoices.agree;
  }

  public submitConsent() {
    if (!this.userConsent) {
      window.location.reload();
      return;
    }
    this.complete();
  }

  getNextSection() {
    return PersonalComponents.autoSignup;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.consentQuestion,
      data: {
        userConsent: this.userConsent,
      },
      next: this.getNextSection(),
    });
  }
}
