import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { PaDataService } from './padata.service';

import { PersonalComponents } from '../personal-components/personal-components.enum';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  public state = {
    isLoading: false,
  };

  private history: ConversationSection[] = [];

  private conversation: ConversationSection[] = [];

  private sectionCompletedSource = new Subject<string>();
  public sectionCompleted$ = this.sectionCompletedSource.asObservable();

  private shouldScrollSource = new Subject<number>();
  public shouldScroll$ = this.shouldScrollSource.asObservable();

  constructor(
    private paData: PaDataService,
  ) {
    console.log('ConversationService()');

    this.init();
  }

  private async init() {
    this.history = await this.getHistory();

    if (this.hasHistory()) {
      this.replayHistory();
    } else {
      this.startNewConversation();
    }
  }

  public startLoading() {
    this.state.isLoading = true;
    this.scrollToEnd();
  }

  public stopLoading() {
    this.state.isLoading = false;
  }

  public scrollToEnd() {
    this.shouldScrollSource.next(-1);
  }

  private async getHistory() {
    let history = await this.paData.retrieve(this.paData.type.conversationHistory);

    if (!history) {
      history = [];
    }

    return history;
  }

  private hasHistory() {
    return (this.history.length > 0);
  }

  private replayHistory() {
    this.history.forEach((section: ConversationSection) => {
      this.addSection(section.name, section.data);
    });
  }

  private startNewConversation() {
    this.addSection(PersonalComponents.selectLanguage);
  }

  private addSection(name: string, data?: any) {
    console.log('ConversationService addSection(): ', name, data);

    this.conversation.push({
      name,
      data,
    });
  }

  private storeSection(section: ConversationSection) {
    console.log('storeSection(): ', section);

    this.history.push(section);
    this.paData.store(this.paData.type.conversationHistory, this.history);
  }

  public onSectionCompleted(section: ConversationSection) {
    console.log('ConverstaionService  onSectionCompleted(): ', section);

    // Record completion date/time:
    section.moment = Date.now();

    // Store all data from this section in history
    this.storeSection(section);

    // Instruct PersonalPage to insert the next section
    if (section.next) {
      this.sectionCompletedSource.next(section.next);
    }
  }

  public getConversationUpToNow(): ConversationSection[] {
    return this.conversation;
  }
}

export class ConversationSection {
  name: string;
  moment?: number;
  data?: any;
  next?: string;
}
