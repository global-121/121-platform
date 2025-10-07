import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { SeedHelperService } from '@121-service/src/scripts/services/seed-helper.service';
import { SeedMockHelperServiceTyped } from '@121-service/src/scripts/services/seed-mock-helper-typed.service';
import { registrationAHWhatsapp } from '@121-service/src/seed-data/mock/registration-pv.data';
import {
  amountVisa,
  registrationVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';
import { waitFor } from '@121-service/src/utils/waitFor.helper';

/**
 * Type-safe version of SeedMultipleNLRCMockData that uses the new factory system.
 * This demonstrates the new approach works with the existing API test.
 */
@Injectable()
export class SeedMultipleNLRCMockDataTyped implements InterfaceScript {
  public constructor(
    private readonly seedMockHelper: SeedMockHelperServiceTyped,
    private axiosCallsService: AxiosCallsService,
    private seedHelper: SeedHelperService,
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
    if (!env.MOCK_INTERSOLVE || !env.MOCK_TWILIO) {
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

    const programIds: number[] = [];
    // Set up 1 registration with 1 payment and 1 message
    if (mockOcw) {
      const programIdOcw = 3;
      programIds.push(programIdOcw);
      await this.seedRegistrationForProgram(programIdOcw, registrationVisa);
    }
    if (mockPv) {
      const programIdPv = 2;
      programIds.push(programIdPv);
      await this.seedRegistrationForProgram(
        programIdPv,
        registrationAHWhatsapp,
      );
    }

    await waitFor(4_000);

    // Blow up data given the parameters - using type-safe factories
    console.log('**USING TYPE-SAFE FACTORIES FOR DATA MULTIPLICATION**');
    await this.seedMockHelper.multiplyRegistrationsAndRelatedPaymentData(
      powerNrRegistrations,
    );
    await this.seedMockHelper.multiplyTransactions(nrPayments, programIds);
    await this.seedMockHelper.multiplyMessages(powerNrMessages);
    await this.seedMockHelper.updateSequenceNumbers();
    await this.seedMockHelper.introduceDuplicates();
    console.log('**TYPE-SAFE FACTORY DATA MULTIPLICATION COMPLETED**');
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
      amountVisa,
      [registration.referenceId],
      accessToken,
    );
  }
}