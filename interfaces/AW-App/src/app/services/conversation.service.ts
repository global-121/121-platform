import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ValidationComponents } from '../validation-components/validation-components.enum';

@Injectable({
  providedIn: 'root',
})
export class ConversationService {
  public state = {
    isLoading: false,
  };

  private history: ConversationHistorySection[] = [];

  private conversation: ConversationSection[] = [];

  private sectionCompletedSource = new Subject<string>();
  public sectionCompleted$ = this.sectionCompletedSource.asObservable();

  private shouldScrollSource = new Subject<number>();
  public shouldScroll$ = this.shouldScrollSource.asObservable();

  constructor() {
    console.log('ConversationService()');

    // get History from Storage:
    this.history = this.getHistory();

    if (this.hasHistory()) {
      // TODO: Replay/build conversation from history
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

  private getHistory() {
    // Define a hard-coded history (for now):
    const history = [];

    return history;
  }

  private hasHistory() {
    return this.history.length > 0;
  }

  startNewConversation() {
    if (environment.useMultiplePrograms) {
      this.addSection(ValidationComponents.selectProgram);
    } else {
      this.addSection(ValidationComponents.mainMenu);
    }
  }

  private addSection(sectionName) {
    console.log('ConversationService addSection(): ', sectionName);

    this.conversation.push({
      name: sectionName,
    });
  }

  private storeSection(section: ConversationSection) {
    console.log('storeSection(): ', section);

    // addToHistory
    // storeHistory
  }

  public onSectionCompleted(section: ConversationSection) {
    console.log('ConversationService  onSectionCompleted(): ', section);

    // Record completion date/time:
    section.moment = new Date();

    // Store all data from this section in history
    this.storeSection(section);

    // Instruct ValidationPage to insert the next section
    if (section.next) {
      this.sectionCompletedSource.next(section.next);
    }
  }

  public getConversationUpToNow(): ConversationSection[] {
    return this.conversation;
  }
}

class ConversationHistorySection {
  readonly name: string;
  readonly data: any;
  readonly timestamp: number;
}

export class ConversationSection {
  name: string;
  moment?: Date;
  data?: any;
  next?: string;
}
