import { Component, Input } from '@angular/core';
import { InstanceInformation } from 'src/app/models/instance.model';
import { PersonalComponent } from 'src/app/personal-components/personal-component.class';
import { PersonalComponents } from 'src/app/personal-components/personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { InstanceService } from 'src/app/services/instance.service';

@Component({
  selector: 'app-consent-question',
  templateUrl: './consent-question.component.html',
  styleUrls: ['./consent-question.component.scss'],
})
export class ConsentQuestionComponent extends PersonalComponent {
  @Input()
  public data: any;

  public instanceInformation: InstanceInformation;

  public userConsent = false;

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
    const instanceInformationSubscription = this.instanceService.instanceInformation.subscribe(
      (instanceInformation) => {
        this.instanceInformation = instanceInformation;
        instanceInformationSubscription.unsubscribe();
      },
    );
  }

  public consent(consent: boolean) {
    if (!consent) {
      window.location.reload();
      return;
    }
    this.userConsent = consent;
    this.complete();
  }

  getNextSection() {
    return PersonalComponents.signupSignin;
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
