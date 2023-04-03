import { Component, OnInit } from '@angular/core';
import {
  LoggingEvent,
  LoggingEventCategory,
} from 'src/app/models/logging-event.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { LoggingService } from 'src/app/services/logging.service';
import { PaDataService } from 'src/app/services/padata.service';
import { PersonalDirective } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';

@Component({
  selector: 'app-next-pa',
  templateUrl: './next-pa.component.html',
  styleUrls: ['./next-pa.component.scss'],
})
export class NextPaComponent extends PersonalDirective implements OnInit {
  public isCanceled = false;
  public showSavePa = true;
  public disableSavePa = false;
  public showAddAnotherPa = false;
  private paQueued = true;
  private isLoggedIn = true;

  constructor(
    public conversationService: ConversationService,
    private paData: PaDataService,
    private logger: LoggingService,
  ) {
    super();

    this.paData.authenticationState$.subscribe((user) => {
      this.isLoggedIn = !!user;
    });
  }

  public ngOnInit() {
    if (this.data) {
      this.initHistory();
      return;
    }
    this.initNew();

    if (this.isOnline) {
      this.showSavePa = false;
      this.showAddAnotherPa = true;
    }
  }

  async initNew() {
    this.conversationService.stopLoading();
  }

  async initHistory() {
    this.isCanceled = this.data.isCanceled;
    if (this.isCanceled) {
      return;
    }
    this.paQueued = this.data.paQueued;
    this.conversationService.stopLoading();
  }

  getNextSection() {
    return '';
  }

  async savePaToQueue() {
    await this.paData.logout(true);
    this.paQueued = true;
    this.disableSavePa = true;
    this.showAddAnotherPa = true;
  }

  async addNewPa() {
    if (this.isLoggedIn) {
      await this.paData.logout(true);
    }
    this.logger.logEvent(LoggingEventCategory.ui, LoggingEvent.batchModeNewPa);
    this.conversationService.restartConversation(
      this.conversationService.conversationActions.afterBatchSubmit,
    );
  }

  cancel() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.nextPa,
      data: {
        isCanceled: this.isCanceled,
      },
      next: this.getNextSection(),
    });
  }

  complete() {
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.nextPa,
      data: {
        paQueued: this.paQueued,
      },
      next: this.getNextSection(),
    });
  }
}
