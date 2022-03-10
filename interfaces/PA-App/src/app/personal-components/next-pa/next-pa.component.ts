import { Component } from '@angular/core';
import { MonitoringInfo } from 'src/app/models/instance.model';
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
  public monitoringQuestion: MonitoringInfo;

  public monitoringChoice: string;
  public monitoringSubmitted: boolean;

  public paQueued: boolean = false;

  constructor(
    public conversationService: ConversationService,
    private paData: PaDataService,
    private logger: LoggingService,
  ) {
    super();
  }

  ngOnInit() {
    console.log('== LOG nextpa');

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
    this.monitoringChoice = this.data.monitoringChoice;
    this.monitoringSubmitted = !!this.data.monitoringChoice;
    this.conversationService.stopLoading();
  }

  getNextSection() {
    return '';
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
      data: {},
      next: this.getNextSection(),
    });
  }

  savePaToQueue() {
    this.paData.savePaToBatch();
    this.paQueued = true;
  }

  async addNewPa() {
    await this.paData.logout();
    this.logger.logEvent(LoggingEventCategory.ui, LoggingEvent.logout);
    window.location.reload();
  }
}
