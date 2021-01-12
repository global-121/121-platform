import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  LoggingEvent,
  LoggingEventCategory,
} from '../models/logging-event.enum';
import { PersonalComponents } from '../personal-components/personal-components.enum';
import { LoggingService } from './logging.service';
import { PaDataService } from './padata.service';

@Injectable({
  providedIn: 'root',
})
export class ConversationService {
  public state = {
    isLoading: false,
  };

  private history: ConversationSection[] = [];

  private conversation: ConversationSection[] = [];

  private updateConversationSource = new Subject<string>();
  public updateConversation$ = this.updateConversationSource.asObservable();
  public conversationActions = ConversationActions;

  private shouldScrollSource = new Subject<number>();
  public shouldScroll$ = this.shouldScrollSource.asObservable();

  constructor(
    private paData: PaDataService,
    private loggingService: LoggingService,
  ) {}

  public async getConversationUpToNow(): Promise<ConversationSection[]> {
    this.startLoading();
    await this.init();
    this.stopLoading();
    return this.conversation;
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
  }

  public stopLoading() {
    this.state.isLoading = false;
  }

  public scrollToEnd() {
    this.shouldScrollSource.next(-1);
  }

  public scrollToLastSection() {
    this.shouldScrollSource.next(-2);
  }

  private async getHistory() {
    let history = await this.paData.retrieve(
      this.paData.type.conversationHistory,
    );

    if (!history) {
      history = [];
    }

    return history;
  }

  private hasHistory() {
    return this.history.length > 0;
  }

  private replayHistory() {
    // Always start with a clean slate:
    this.conversation = [];

    this.history.forEach((section: ConversationSection, index: number) => {
      this.addSection(section.name, section.moment, section.data);

      // Activate the next-section from the last-section-from-history
      if (index === this.history.length - 1) {
        this.addSection(section.next);
      }
    });
  }

  private startNewConversation() {
    this.conversation = [];
    this.addSection(PersonalComponents.selectLanguage);
  }

  private addSection(name: string, moment?: number, data?: any) {
    console.log('ConversationService addSection(): ', name, data);

    this.conversation.push({
      name,
      moment,
      data,
    });
  }

  private storeSection(section: ConversationSection) {
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
      this.updateConversationSource.next(section.next);
    }

    // Log result
    this.loggingService.logEvent(
      LoggingEventCategory.progress,
      LoggingEvent.sectionCompleted,
      {
        name: section.name,
      },
    );
  }

  public async restoreAfterLogin() {
    this.updateConversationSource.next(this.conversationActions.afterLogin);
  }

  public debugUndoLastStep() {
    this.history.pop();
    this.paData.store(this.paData.type.conversationHistory, this.history, true);
  }

  public debugFillHistory() {
    const fillWith = window.prompt(
      'Fill history with:',
      JSON.stringify(this.history),
    );

    if (!fillWith) {
      return;
    }

    this.history = JSON.parse(fillWith);
    this.paData.store(this.paData.type.conversationHistory, this.history);
  }
}

export class ConversationSection {
  name: string;
  moment?: number;
  data?: any;
  next?: string;
}

export enum ConversationActions {
  afterLogin = 'after-login',
}
