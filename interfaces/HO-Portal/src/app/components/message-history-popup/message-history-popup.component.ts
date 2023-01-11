import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {
  Message,
  MessageStatus,
  TwilioStatus,
} from '../../models/message.model';
import { Person } from '../../models/person.model';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';

@Component({
  selector: 'app-message-history-popup',
  templateUrl: './message-history-popup.component.html',
  styleUrls: ['./message-history-popup.component.scss'],
})
export class MessageHistoryPopupComponent implements OnInit {
  @Input()
  public person: Person;

  @Input()
  public programId: number;

  public messageHistory: Message[];
  public historySize = 5;
  public trimBodyLength = 20;
  public imageString = '(image)';
  public rowIndex: number;

  public chipStatus = {
    [TwilioStatus.accepted]: MessageStatus.sent,
    [TwilioStatus.delivered]: MessageStatus.delivered,
    [TwilioStatus.delivery_unknown]: MessageStatus.sent,
    [TwilioStatus.failed]: MessageStatus.failed,
    [TwilioStatus.queued]: MessageStatus.sent,
    [TwilioStatus.read]: MessageStatus.read,
    [TwilioStatus.scheduled]: MessageStatus.sent,
    [TwilioStatus.sending]: MessageStatus.sent,
    [TwilioStatus.sent]: MessageStatus.sent,
    [TwilioStatus.undelivered]: MessageStatus.failed,
  };

  constructor(
    private programsService: ProgramsServiceApiService,
    private modalController: ModalController,
  ) {}

  ngOnInit() {
    this.getMessageHistory();
  }

  private async getMessageHistory() {
    this.messageHistory = await this.programsService.retrieveMsgHistory(
      this.programId,
      this.person.referenceId,
    );
  }
  public async loadMore(historyLength) {
    this.historySize = historyLength;
  }
  public openMessageDetails(index) {
    if (index === this.rowIndex) {
      this.rowIndex = null;
    } else {
      this.rowIndex = index;
    }
  }

  public closeModal() {
    this.modalController.dismiss();
  }
}
