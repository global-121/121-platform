import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
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

  public messageHistory: any;
  public historySize = 5;
  public trimBodyLength = 20;
  public imageString = '(image)';
  public rowIndex: number;

  constructor(
    private programsService: ProgramsServiceApiService,
    private modalController: ModalController,
  ) {}

  ngOnInit() {
    this.getMessageHistory();
  }

  private async getMessageHistory() {
    const msghistory = await this.programsService.retrieveMsgHistory(
      this.programId,
      this.person.referenceId,
    );
    this.messageHistory = msghistory;
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
