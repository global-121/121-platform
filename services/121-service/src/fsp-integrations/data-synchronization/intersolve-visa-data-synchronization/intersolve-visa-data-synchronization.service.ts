import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';
import { IntersolveVisaService } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/services/intersolve-visa.service';
import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { getFspAttributeNames } from '@121-service/src/fsp-management/fsp-settings.helpers';

@Injectable()
export class IntersolveVisaDataSynchronizationService {
  private readonly intersolveVisaAttributeNames: string[];

  public constructor(
    private readonly intersolveVisaService: IntersolveVisaService,
  ) {
    this.intersolveVisaAttributeNames = getFspAttributeNames(
      Fsps.intersolveVisa,
    );
  }

  public async syncData({
    registrationId,
    attribute,
    contactInformation,
  }: {
    registrationId: number;
    attribute?: string;
    contactInformation: ContactInformation;
  }): Promise<void> {
    if (attribute) {
      if (
        !env.INTERSOLVE_VISA_SEND_UPDATED_CONTACT_INFORMATION ||
        !this.intersolveVisaAttributeNames.includes(attribute)
      ) {
        return;
      }
    }

    const registrationHasVisaCustomer =
      await this.intersolveVisaService.hasIntersolveCustomer(registrationId);

    if (registrationHasVisaCustomer) {
      await this.intersolveVisaService.sendUpdatedCustomerInformation({
        registrationId,
        contactInformation,
      });
    }
  }
}
