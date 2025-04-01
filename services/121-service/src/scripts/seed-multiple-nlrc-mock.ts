import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import { SeedMockHelper } from '@121-service/src/scripts/seed-mock-helpers';
import { registrationAHWhatsapp } from '@121-service/src/seed-data/mock/registration-pv.data';
import {
  amountVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';
import { shouldBeEnabled } from '@121-service/src/utils/env-variable.helpers';
import { waitFor } from '@121-service/src/utils/waitFor.helper';

@Injectable()
export class SeedMultipleNLRCMockData implements InterfaceScript {
  public constructor(
    private readonly seedMockHelper: SeedMockHelper,
    private axiosCallsService: AxiosCallsService,
    private seedHelper: SeedHelper,
  ) {}

  public async run(
    isApiTests?: boolean,
    powerNrRegistrationsString?: string,
    nrPaymentsString?: string,
    powerNrMessagesString?: string,
    mockPv = true,
    mockOcw = true,
    seedConfig?: SeedConfigurationDto,
  ): Promise<void> {
    if (
      !shouldBeEnabled(process.env.MOCK_INTERSOLVE) ||
      !shouldBeEnabled(process.env.MOCK_TWILIO)
    ) {
      throw new HttpException(
        `MOCK_INTERSOLVE or MOCK_TWILIO is not set to true`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const { powerNrRegistrations, nrPayments, powerNrMessages } =
      await this.seedMockHelper.validateParametersForDataDuplication({
        powerNrRegistrationsString,
        nrPaymentsString,
        powerNrMessagesString,
      });
    // ************************

    // Set up organization and program
    await this.seedHelper.seedData(seedConfig!, isApiTests);

    // Set up 1 registration with 1 payment and 1 message
    if (mockOcw) {
      const programIdOcw = 3;
      await this.seedRegistrationForProgram(programIdOcw, registrationVisa);
    }
    if (mockPv) {
      const programIdPV = 2;
      await this.seedRegistrationForProgram(
        programIdPV,
        registrationAHWhatsapp,
      );
    }

    await waitFor(4_000);

    // Blow up data given the parameters
    await this.seedMockHelper.multiplyRegistrationsAndRelatedPaymentData(
      powerNrRegistrations,
    );
    await this.seedMockHelper.multiplyTransactions(nrPayments);
    await this.seedMockHelper.multiplyMessages(powerNrMessages);
    await this.seedMockHelper.updateSequenceNumbers();
    await this.seedMockHelper.introduceDuplicates();
  }

  private async seedRegistrationForProgram(
    programId: number,
    registration: any,
  ): Promise<void> {
    const accessToken = await this.axiosCallsService.getAccessToken();
    await this.seedMockHelper.importRegistrations(
      programId,
      [registration],
      accessToken,
    );
    await this.seedMockHelper.awaitChangePaStatus(
      programId,
      [registration.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );

    await this.seedMockHelper.doPayment(
      programId,
      1,
      amountVisa,
      [registration.referenceId],
      accessToken,
    );
  }
}
