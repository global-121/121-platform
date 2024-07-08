import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedMockHelper } from '@121-service/src/scripts/seed-mock-helpers';
import { SeedMultipleNLRC } from '@121-service/src/scripts/seed-multiple-nlrc';
import { registrationAHWhatsapp } from '@121-service/src/seed-data/mock/registration-pv.data';
import {
  amountVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { DataSource } from 'typeorm';

@Injectable()
export class SeedMultipleNLRCMockData implements InterfaceScript {
  public constructor(
    private dataSource: DataSource,
    private readonly seedMockHelper: SeedMockHelper,
    private axiosCallsService: AxiosCallsService,
    private seedMultipleNLRC: SeedMultipleNLRC,
  ) {}

  public async run(
    isApiTests?: boolean,
    powerNrRegistrationsString?: string,
    nrPaymentsString?: string,
    powerNrMessagesString?: string,
    mockPv = true,
    mockOcw = true,
  ): Promise<void> {
    if (!process.env.MOCK_INTERSOLVE || !process.env.MOCK_TWILIO) {
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
    await this.seedMultipleNLRC.run(isApiTests);

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
