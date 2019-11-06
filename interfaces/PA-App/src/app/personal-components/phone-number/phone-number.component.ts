import { Component } from '@angular/core';
import { PersonalComponent } from '../personal-component.class';
import { PersonalComponents } from '../personal-components.enum';
import { ConversationService } from 'src/app/services/conversation.service';
import { TranslateService } from '@ngx-translate/core';
import { PaDataService } from 'src/app/services/padata.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';

@Component({
  selector: 'app-phone-number',
  templateUrl: './phone-number.component.html',
  styleUrls: ['./phone-number.component.scss'],
})
export class PhoneNumberComponent extends PersonalComponent {
  public phoneSkipped: boolean;
  public choiceMade = false;
  public phoneNumber: number;
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
  }

  ngOnInit() {
    this.paData.retrieve('ngo').then(value => {
      this.ngo = value;
    });
  }

  public async submitPhoneNumber(phone: any) {
    this.choiceMade = true;
    this.phoneSkipped = false;
    this.phoneNumber = await phone;

    this.paData.retrieve(this.paData.type.did).then(async (did) => {
      await this.programService.postPhoneNumber(did, String(this.phoneNumber)).subscribe(() => {
        console.log('Phone number posted');
      });
      this.complete();
    });
  }

  public skipPhone() {
    this.choiceMade = true;
    this.phoneSkipped = true;
    this.phone = '';
    this.complete();
  }

  getNextSection() {
    // Here goes something that you move to end of up-to-date conversation history??
    return PersonalComponents.meetingReminder;
  }

  complete() {
    this.isDisabled = true;
    this.conversationService.onSectionCompleted({
      name: PersonalComponents.phoneNumber,
      data: {
        username: this.phoneSkipped,
        password: this.phoneNumber,
      },
      next: this.getNextSection(),
    });
  }

}
