import { Injectable } from '@nestjs/common';

import { DebitCardsIntersolveVisaService } from '@121-service/src/debit-cards-intersolve-visa/debit-cards-intersolve-visa.service';
import { DebitCardsContactInfo } from '@121-service/src/debit-cards-intersolve-visa/types/debit-cards-contact-info.interface';
import { env } from '@121-service/src/env';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationAttributeChangeHandler } from '@121-service/src/registration/interfaces/registration-attribute-change-handler.interface';

@Injectable()
export class IntersolveVisaRegistrationAttributeChangeHandler
  implements RegistrationAttributeChangeHandler
{
  private readonly intersolveVisaAttributeNames: string[];

  public constructor(
    private readonly debitCardsIntersolveVisaService: DebitCardsIntersolveVisaService,
  ) {
    this.intersolveVisaAttributeNames = FSP_SETTINGS[
      Fsps.intersolveVisa
    ].attributes.map((attr) => attr.name) as string[];
  }

  public async handleAttributeChange({
    registration,
    attribute,
  }: {
    registration: RegistrationEntity;
    attribute: string;
  }): Promise<void> {
    if (
      !env.INTERSOLVE_VISA_SEND_UPDATED_CONTACT_INFORMATION ||
      !this.intersolveVisaAttributeNames.includes(attribute)
    ) {
      return;
    }

    const contactInfo: DebitCardsContactInfo =
      await this.debitCardsIntersolveVisaService.getContactInformation(
        registration,
      );

    await this.debitCardsIntersolveVisaService.sendCustomerInformationToIntersolve(
      { registration, contactInfo },
    );
  }
}
