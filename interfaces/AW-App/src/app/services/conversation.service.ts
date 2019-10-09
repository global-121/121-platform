import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {

  private history: ConversationHistorySection[] = [];

  private conversation: ConversationSection[] = [];

  private sectionCompletedSource = new Subject<ConversationSection>();
  public sectionCompleted$ = this.sectionCompletedSource.asObservable();

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

  private getHistory() {
    // Define a hard-coded history (for now):
    const history = [
    ];


    return history;
  }

  private hasHistory() {
    return (this.history.length > 0);
  }

  startNewConversation() {
    this.addSection('main-menu');
  }

  private addSection(sectionName) {
    console.log('ConversationService addSection(): ', sectionName);

    this.conversation.push({
      name: sectionName
    });
  }

  public onSectionCompleted(section: ConversationSection) {
    console.log('ConversationService  onSectionCompleted(): ', section);

    // Instruct ValidationPage to insert the next section
    this.sectionCompletedSource.next(section);
  }

  public getConversationUpToNow(): ConversationSection[] {
    return this.conversation;
  }

  public continueAfterScan() {
    console.log('continueAfterScan');
  }

}

class ConversationHistorySection {
  readonly name: string;
  readonly data: any;
  readonly timestamp: number;
}

export class ConversationSection {
  name: string;
  data?: any;
  next?: string;
}
