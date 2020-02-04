import { Component, Input } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { TranslateService } from '@ngx-translate/core';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-set-notification-number',
  templateUrl: './set-notification-number.component.html',
  styleUrls: ['./set-notification-number.component.scss'],
})
export class SetNotificationNumberComponent extends PersonalComponent {
  @Input()
  public data: any;

  public useLocalStorage: boolean;

  public languageCode: string;

  public phoneSkipped: boolean;
  public choiceMade = false;
  public phoneNumber: string;
  public phone: any;
  public ngo: string;
  public did: string;

  constructor(
    private conversationService: ConversationService,
    public translate: TranslateService,
    public paData: PaDataService,
    public programService: ProgramsServiceApiService,
  ) {
    super();
    this.useLocalStorage = environment.localStorage;
    this.languageCode = this.translate.currentLang;
  }

  async ngOnInit() {
    await this.checkExistingPhoneNumber();

    if (this.isCanceled) {
      return;
    }

    this.ngo = await this.getNgo();

    if (this.data) {
      this.initHistory();
      return;
    }

    this.initNew();
  }

  async initNew() {
    this.did = await this.paData.retrieve(this.paData.type.did);
  }

  initHistory() {
    if (this.data.isCanceled) {
      return this.cancel();
    }

    this.isDisabled = true;
    this.choiceMade = true;
    this.phoneSkipped = this.data.phoneSkipped;
    this.phoneNumber = this.data.phoneNumber;
  }

  async getNgo() {
    const currentProgram = await this.paData.getCurrentProgram();
    return currentProgram.ngo;
  }

  private async checkExistingPhoneNumber() {
    this.phoneNumber = await this.paData.retrieve(this.paData.type.phoneNumber);

    if (this.phoneNumber) {
      this.did = await this.paData.retrieve(this.paData.type.did);
      this.programService.postPhoneNumber(this.did, this.phoneNumber, this.languageCode)
        .then(() => {
          this.cancel();
        });
    }
  }

  public async submitPhoneNumber(phone: any) {
    this.choiceMade = true;
    this.phoneSkipped = false;
    this.phoneNumber = this.sanitizePhoneNumber(phone);

    this.programService.postPhoneNumber(this.did, this.phoneNumber, this.languageCode)
      .then(() => {
        this.complete();
      });
  }

  public sanitizePhoneNumber(phoneNumber: string): string {
    // Remove any non-digit character exept the '+' sign
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  public skipPhone() {
    this.choiceMade = true;
    this.phoneSkipped = true;
    this.phone = '';
    this.complete();
  }

  getNextSection() {
    return PersonalComponents.meetingReminder;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.setNotificationNumber,
      data: {
        phoneSkipped: this.phoneSkipped,
        phoneNumber: this.phoneNumber,
      },
      next: this.getNextSection(),
    });
  }

  cancel() {
    this.isCanceled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.setNotificationNumber,
      data: {
        isCanceled: this.isCanceled,
      },
      next: this.getNextSection(),
    });
  }

}
