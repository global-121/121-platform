import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { IntersolveVisaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/intersolve-visa-account-management/intersolve-visa-account-management.service';
import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsp-management/fsp-settings.const';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Injectable()
export class IntersolveVisaDataSynchronizationService {
  private readonly intersolveVisaAttributeNames: string[];

  public constructor(
    private readonly intersolveVisaAccountManagementService: IntersolveVisaAccountManagementService,
  ) {
    this.intersolveVisaAttributeNames = FSP_SETTINGS[
      Fsps.intersolveVisa
    ].attributes.map((attr) => attr.name) as string[];
  }

  public async syncData({
    registration,
    attribute,
  }: {
    registration: RegistrationEntity;
    attribute: string;
  }): Promise<void> {
    if (
      env.INTERSOLVE_VISA_SEND_UPDATED_CONTACT_INFORMATION &&
      this.intersolveVisaAttributeNames.includes(attribute)
    ) {
      await this.intersolveVisaAccountManagementService.sendCustomerInformationToIntersolve(
        registration,
      );
    }
  }
}
