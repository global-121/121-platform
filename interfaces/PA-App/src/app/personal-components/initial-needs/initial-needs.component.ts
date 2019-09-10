import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-initial-needs',
  templateUrl: './initial-needs.component.html',
  styleUrls: ['./initial-needs.component.scss'],
})
export class InitialNeedsComponent implements PersonalComponent {

  public needs: any;
  public needsSubmitted: boolean;

  constructor(
    public conversationService: ConversationService,
  ) { }

  ngOnInit() {
  }

  public submitNeeds(needsInput) {
    console.log('needs-input: ', needsInput, this.needs);
    this.needsSubmitted = true;

    this.complete();
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
