import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { Person } from '../../models/person.model';
import {
  RegistrationActivity,
  RegistrationActivityType,
} from '../../models/registration-activity.model';
import { MessagesService } from '../../services/messages.service';
import { ProgramsServiceApiService } from '../../services/programs-service-api.service';

@Component({
  selector: 'app-message-history-popup',
  templateUrl: './message-history-popup.component.html',
  styleUrls: ['./message-history-popup.component.scss'],
})
export class MessageHistoryPopupComponent implements OnInit {
  @Input()
  public referenceId: string;

  @Input()
  public programId: number;

  public person: Person;
  public messageHistory: RegistrationActivity[];

  public errorCodeUrl = `${environment.twilio_error_codes_url}/`;
  public locale: string;

  constructor(
    private programsService: ProgramsServiceApiService,
    private messageServices: MessagesService,
    private modalController: ModalController,
    private translate: TranslateService,
  ) {
    this.locale = this.translate.currentLang || environment.defaultLocale;
  }

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
    this.messageHistory = (
      await this.messageServices.getMessageHistory(
        this.programId,
        this.referenceId,
      )
    ).map((message) => ({
      type: RegistrationActivityType.message,
      label: this.translate.instant(
        'registration-details.activity-overview.activities.message.label',
      ),
      date: new Date(message.created),
      description: message.body,
      activityStatus: message.messageStatus,
      messageErrorCode: message.errorCode || null,
    }));
  }

  public closeModal() {
    this.modalController.dismiss();
  }
}
