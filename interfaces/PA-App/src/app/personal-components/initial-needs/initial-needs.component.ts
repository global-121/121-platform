import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { environment } from 'src/environments/environment';
import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-initial-needs',
  templateUrl: './initial-needs.component.html',
  styleUrls: ['./initial-needs.component.scss'],
})
export class InitialNeedsComponent extends PersonalComponent {
  public needs: any;
  public needsReceived: boolean;

  constructor(
    public conversationService: ConversationService,
  ) {
    super();
  }

  ngOnInit() {
  }

  public submitNeeds(needsInput) {
    console.log('needs-input: ', needsInput, this.needs);
    this.isDisabled = true;
    this.conversationService.startLoading();

    // TODO: POST answers to API; when successful complete()
    window.setTimeout(() => {
      this.needsReceived = true;
      this.conversationService.stopLoading();
      this.complete();
    }, environment.isDebug ? 0 : 1000);
  }

  getNextSection() {
    return PersonalComponents.chooseCredentialType;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.initialNeeds,
      data: {
        needs: this.needs,
      },
      next: this.getNextSection(),
    });
  }
}
