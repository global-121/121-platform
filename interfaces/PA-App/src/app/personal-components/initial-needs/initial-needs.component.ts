import { Component, Input } from '@angular/core';
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
  @Input()
  public data: any;

  public needs: any;
  public needsReceived: boolean;

  constructor(
    public conversationService: ConversationService,
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
    this.needsReceived = this.data.needsReceived;
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
    return PersonalComponents.selectCountry;
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.initialNeeds,
      data: {
        needsReceived: this.needsReceived,
      },
      next: this.getNextSection(),
    });
  }
}
