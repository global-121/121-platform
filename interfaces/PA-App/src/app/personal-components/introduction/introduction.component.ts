import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.interface';

import { ConversationService } from 'src/app/services/conversation.service';

@Component({
  selector: 'app-introduction',
  templateUrl: './introduction.component.html',
  styleUrls: ['./introduction.component.scss'],
})
export class IntroductionComponent implements PersonalComponent {
  constructor(
    public conversationService: ConversationService
  ) { }

  ngOnInit() {
    this.complete();
  }

  getNextSection() {
    return 'select-language';
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: 'introduction',
      next: this.getNextSection(),
    });
  }
}
