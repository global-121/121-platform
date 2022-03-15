import { Component } from '@angular/core';
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
export class NextPaComponent extends PersonalDirective {
  public isCanceled = false;
  public paQueued = false;

  constructor(
    public conversationService: ConversationService,
    private paData: PaDataService,
    private logger: LoggingService,
  ) {
    super();
  }

  ngOnInit() {
    if (this.data) {
      this.initHistory();
      return;
    }
    this.initNew();
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

  savePaToQueue() {
    this.paData.savePaToBatch();
    this.paQueued = true;
  }

  async addNewPa() {
    await this.paData.logout();
    this.logger.logEvent(LoggingEventCategory.ui, LoggingEvent.batchModeNewPa);
    window.location.reload();
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
