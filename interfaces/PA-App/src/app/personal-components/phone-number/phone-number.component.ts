import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { TranslateService } from '@ngx-translate/core';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-phone-number',
  templateUrl: './phone-number.component.html',
  styleUrls: ['./phone-number.component.scss'],
})
export class PhoneNumberComponent extends PersonalComponent {

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
  }

  async ngOnInit() {
    this.languageCode = this.translate.currentLang;
    this.did = await this.paData.retrieve(this.paData.type.did);
    this.ngo = await this.getNgo();
  }

  async getNgo() {
    const currentProgram = await this.paData.getCurrentProgram();
    return currentProgram.ngo;
  }

  public async submitPhoneNumber(phone: any) {
    this.choiceMade = true;
    this.phoneSkipped = false;
    this.phoneNumber = this.sanitizePhoneNumber(phone);

    this.programService.postPhoneNumber(this.did, this.phoneNumber, this.languageCode).subscribe(() => {
      this.complete();
    });
  }

  private sanitizePhoneNumber(phoneNumber: string): string {
    // TODO: add more complex rules to 'clean' messy input
    return phoneNumber.trim();
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
      name: PersonalComponents.phoneNumber,
      data: {
        phoneSkipped: this.phoneSkipped,
        phoneNumber: this.phoneNumber,
      },
      next: this.getNextSection(),
    });
  }

}
