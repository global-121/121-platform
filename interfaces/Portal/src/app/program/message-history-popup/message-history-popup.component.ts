import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Person } from 'src/app/models/person.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { Message } from '../../models/message.model';
import { MessageHistoryItemComponent } from '../message-history-item/message-history-item.component';

@Component({
  selector: 'app-message-history-popup',
  templateUrl: './message-history-popup.component.html',
  styleUrls: ['./message-history-popup.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    TranslateModule,
    MessageHistoryItemComponent,
  ],
})
export class MessageHistoryPopupComponent implements OnInit {
  @Input()
  public referenceId: string;

  @Input()
  public programId: number;

  public person: Person;
  public messageHistory: Message[];

  constructor(
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
  ) {}

  async ngOnInit() {
    await this.getPersonData();
    this.getMessageHistory();
  }

  private async getPersonData() {
    const res = await this.programsService.getPeopleAffected(
      this.programId,
      1,
      1,
      this.referenceId,
    );
    this.person = res.data[0];
  }

  private async getMessageHistory() {
    this.messageHistory = await this.programsService.retrieveMsgHistory(
      this.programId,
      this.referenceId,
    );
  }

  public closeModal() {
    this.modalController.dismiss();
  }
}
