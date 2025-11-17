import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
import { SeedHelperService } from '@121-service/src/scripts/services/seed-helper.service';
import { SeedMockHelperService } from '@121-service/src/scripts/services/seed-mock-helper.service';
import { registrationAHWhatsapp } from '@121-service/src/seed-data/mock/registration-pv.data';
import {
  registrationVisa,
  transferValueVisa,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';
import { waitFor } from '@121-service/src/utils/waitFor.helper';

@Injectable()
export class SeedMultipleNLRCMockData implements InterfaceScript {
  public constructor(
    private readonly seedMockHelper: SeedMockHelperService,
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

    // 0. Set up program data
    await this.seedHelper.seedData(seedConfig!, isApiTests);

    // 1. Set up 1 registration with 1 payment and 1 message via the API for each program
    const programIds: number[] = [];
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

    // 2. Multiply registrations
    await this.seedMockHelper.multiplyRegistrations(powerNrRegistrations);

    // 3. Extend all data to all registrations (transactions and related data for payment 1, messages, etc.)
    await this.seedMockHelper.alignOtherDataWithRegistrations({
      powerNr: powerNrRegistrations,
      programIds,
    });

    // 4. Extend all payment-related data to multiple payments
    await this.seedMockHelper.addExtraPaymentsAndAlignRelatedData({
      nrPayments,
    });

    // 5. Extend all message-related data to multiple messages
    await this.seedMockHelper.multiplyMessages(powerNrMessages);

    // 6. Update all derived data (latest message, payment count, etc.)
    await this.seedMockHelper.updateDerivedData();
    await this.seedMockHelper.introduceDuplicates();

    // 7. Final clean-up: update sequence numbers and introduce duplicates
    await this.seedMockHelper.updateSequenceNumbers();

    console.log('**SEEDING MULTIPLE NLRC MOCK DATA COMPLETED**');
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

    const createPaymentResponse = await this.seedMockHelper.createPayment(
      programId,
      transferValueVisa,
      [registration.referenceId],
      accessToken,
    );
    const paymentId = createPaymentResponse.data.id;
    await waitFor(2_000);
    await this.seedMockHelper.startPayment(programId, paymentId, accessToken);
  }
}
