import { Component, OnInit } from '@angular/core';
import RegistrationStatus from '../enums/registration-status.enum';
import { Person } from '../models/person.model';

@Component({
  selector: 'app-recipient-page',
  templateUrl: './recipient.page.html',
  styleUrls: ['./recipient.page.scss'],
})
export class RecipientPage implements OnInit {
  public recipients: Person[];
  private queryParamPhonenumber = '+15005550002';

  constructor() {}

  async ngOnInit() {
    this.recipients = await this.getPhoneNumberDetails(
      this.queryParamPhonenumber,
    );
  }

  private async getPhoneNumberDetails(phoneNumber: string): Promise<Person[]> {
    console.log('phoneNumber: ', phoneNumber);
    return [
      {
        id: 102,
        phoneNumber: '+15005550002',
        referenceId: '',
        programId: 1,
        status: RegistrationStatus.included,
        registrationProgramId: 1,
      },
      {
        id: 103,
        phoneNumber: '+15005550003',
        referenceId: '',
        programId: 1,
        status: RegistrationStatus.included,
        registrationProgramId: 2,
      },
      {
        id: 104,
        phoneNumber: '+15005550002',
        referenceId: '',
        programId: 2,
        status: RegistrationStatus.included,
        registrationProgramId: 1,
      },
    ];
  }
}
