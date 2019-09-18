import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-introduction',
  templateUrl: './introduction.component.html',
  styleUrls: ['./introduction.component.scss'],
})
export class IntroductionComponent extends PersonalComponent {
  constructor(
    public conversationService: ConversationService
  ) {
    super();
  }

  ngOnInit() {
    this.complete();
  }

  getNextSection() {
    return PersonalComponents.selectLanguage;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.introduction,
      next: this.getNextSection(),
    });
  }
}
