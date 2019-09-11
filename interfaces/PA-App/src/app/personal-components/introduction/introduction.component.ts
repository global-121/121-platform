import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';
import { PersonalComponents } from '../personal-components.enum';

import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-introduction',
  templateUrl: './introduction.component.html',
  styleUrls: ['./introduction.component.scss'],
})
export class IntroductionComponent implements PersonalComponent {
  isDisabled = false;

  constructor(
    public conversationService: ConversationService
  ) { }

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
