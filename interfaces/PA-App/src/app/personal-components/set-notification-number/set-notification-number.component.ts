import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PersonalComponent } from 'src/app/personal-components/personal-component.class';
import { PersonalComponents } from 'src/app/personal-components/personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
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
  public placeholder: string;
  public did: string;

  public hasValidationError: boolean;
  public phoneNumberIsValid: boolean;

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
    if (this.data) {
      this.initHistory();
      return;
    }

    this.initNew();
  }

  async initNew() {
    await this.checkExistingPhoneNumber();

    if (this.isCanceled) {
      return;
    }

    this.placeholder = await this.getPlaceholder();
  }

  async initHistory() {
    this.isCanceled = this.data.isCanceled;

    if (this.isCanceled) {
      return;
    }

    this.isDisabled = true;
    this.choiceMade = true;
    this.phoneSkipped = this.data.phoneSkipped;
    this.phoneNumber = this.data.phoneNumber;
    this.phone = this.phoneNumber;
    this.placeholder = await this.getPlaceholder();
  }

  async getPlaceholder() {
    const currentProgram = await this.paData.getCurrentProgram();
    const phoneNumberPlaceholder = currentProgram.phoneNumberPlaceholder;
    if (!phoneNumberPlaceholder) {
      return '';
    }
    return phoneNumberPlaceholder;
  }

  private async checkExistingPhoneNumber() {
    const phoneNumber = await this.paData.retrieve(
      this.paData.type.phoneNumber,
    );

    if (phoneNumber) {
      await this.storePhoneNumber(phoneNumber);
      this.cancel();
    }
  }

  public async submitPhoneNumber(phoneNumber: string) {
    this.phoneNumber = this.sanitizePhoneNumber(phoneNumber);

    if (!this.phoneNumberIsValid) {
      this.hasValidationError = true;
      return;
    }

    this.hasValidationError = false;
    this.choiceMade = true;
    this.phoneSkipped = false;

    await this.storePhoneNumber(this.phoneNumber);
    this.complete();
  }

  private sanitizePhoneNumber(phoneNumber: string): string {
    // Remove any non-digit character exept the '+' sign
    return phoneNumber.replace(/[^\d+]/g, '');
  }

  private async storePhoneNumber(phoneNumber: string) {
    const did = await this.paData.retrieve(this.paData.type.did);

    const useForInvitationMatching = true;

    return this.programService.postPhoneNumber(
      did,
      phoneNumber,
      this.languageCode,
      useForInvitationMatching,
    );
  }

  public skipPhone() {
    this.choiceMade = true;
    this.phoneSkipped = true;
    this.phone = '';
    this.complete();
  }

  getNextSection() {
    return PersonalComponents.preprintedQrcode;
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
