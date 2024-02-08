import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
// TODO: Need to do something with translations?
//import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormat } from 'src/app/enums/date-format.enum';
import { Person } from 'src/app/models/person.model';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from '../../../environments/environment';
import { Message, MessageStatusMapping } from '../../models/message.model';
import { MessageHistoryItemComponent } from '../message-history-item/message-history-item.component';

@Component({
  selector: 'app-new-message-history-popup',
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

  // TODO: Why are these variables public?
  public person: Person;
  public DateFormat = DateFormat;
  public messageHistory: Message[];
  public historySize = 5;
  public trimBodyLength = 20;
  public imageString = '(image)';
  public rowIndex: number;
  public chipStatus = MessageStatusMapping;
  public errorCodeUrl = `${environment.twilio_error_codes_url}/`;

  constructor(
    private modalController: ModalController,
    private programsService: ProgramsServiceApiService,
    // TODO: Do we need the translate service?
    //private translate: TranslateService,
    //private pastPaymentsService: PastPaymentsService,
  ) {}

  async ngOnInit() {
    // TODO: do we need (to call) this function?
    await this.getPersonData();
    //this.paDisplayName = this.person?.personAffectedSequence;
    this.getMessageHistory();

    // if (this.canViewPersonalData) {
    //   this.paDisplayName = this.person?.name;
    // }
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

  // TODO: What is this for and where is it used?
  public async loadMore(historyLength) {
    this.historySize = historyLength;
  }

  // TODO: What is this for and where is it used?
  public openMessageDetails(index) {
    if (index === this.rowIndex) {
      this.rowIndex = null;
    } else {
      this.rowIndex = index;
    }
  }

  // Call to close the pop-up
  public closeModal() {
    this.modalController.dismiss();
  }
}
