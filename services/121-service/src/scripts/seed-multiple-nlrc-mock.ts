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

@Injectable()
export class SeedMultipleNLRCMockData implements InterfaceScript {
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
    const startTime = Date.now();
    
    try {
      console.log(`[${new Date().toISOString()}] SEED INFO: Starting NLRC mock data seeding`, {
        isApiTests,
        mockPv,
        mockOcw,
        configName: seedConfig?.name,
      });

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

      console.log(`[${new Date().toISOString()}] SEED INFO: Data multiplication parameters validated`, {
        powerNrRegistrations,
        nrPayments,
        powerNrMessages,
      });

      // Set up organization and program
      await this.seedHelper.seedData(seedConfig!, isApiTests);
      console.log(`[${new Date().toISOString()}] SEED INFO: Base seed data completed`);

      const programIds: number[] = [];
      
      // Set up 1 registration with 1 payment and 1 message
      if (mockOcw) {
        const programIdOcw = 3;
        programIds.push(programIdOcw);
        console.log(`[${new Date().toISOString()}] SEED INFO: Seeding OCW program registration`, { programId: programIdOcw });
        await this.seedRegistrationForProgram(programIdOcw, registrationVisa);
      }
      
      if (mockPv) {
        const programIdPv = 2;
        programIds.push(programIdPv);
        console.log(`[${new Date().toISOString()}] SEED INFO: Seeding PV program registration`, { programId: programIdPv });
        await this.seedRegistrationForProgram(
          programIdPv,
          registrationAHWhatsapp,
        );
      }

      console.log(`[${new Date().toISOString()}] SEED INFO: Waiting for registration processing to complete`);
      await waitFor(4_000);

      // Blow up data given the parameters - now using type-safe factories
      const multiplicationStartTime = Date.now();
      console.log(`[${new Date().toISOString()}] SEED INFO: Starting type-safe factory data multiplication`, {
        powerNrRegistrations,
        nrPayments, 
        powerNrMessages,
        programIds,
      });
      
      await this.seedMockHelper.multiplyRegistrationsAndRelatedPaymentData(
        powerNrRegistrations,
      );
      await this.seedMockHelper.multiplyTransactions(nrPayments, programIds);
      await this.seedMockHelper.multiplyMessages(powerNrMessages);
      await this.seedMockHelper.updateSequenceNumbers();
      await this.seedMockHelper.introduceDuplicates();
      
      const multiplicationDuration = Date.now() - multiplicationStartTime;
      console.log(`[${new Date().toISOString()}] SEED TIMING: Type-safe factory data multiplication completed (${multiplicationDuration}ms)`);
      
      const totalDuration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] SEED TIMING: NLRC mock data seeding completed successfully (${totalDuration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${new Date().toISOString()}] SEED ERROR: NLRC mock data seeding failed (${duration}ms)`, error);
      throw error;
    }
  }

  private async seedRegistrationForProgram(
    programId: number,
    registration: any,
  ): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] SEED INFO: Starting registration seeding for program`, {
        programId,
        registrationId: registration.referenceId,
      });

      const accessToken = await this.axiosCallsService.getAccessToken();
      
      await this.seedMockHelper.importRegistrations(
        programId,
        [registration],
        accessToken,
      );
      console.log(`[${new Date().toISOString()}] SEED INFO: Registration imported successfully`);

      await this.seedMockHelper.awaitChangePaStatus(
        programId,
        [registration.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
      console.log(`[${new Date().toISOString()}] SEED INFO: Registration status changed to included`);

      await this.seedMockHelper.doPayment(
        programId,
        amountVisa,
        [registration.referenceId],
        accessToken,
      );
      console.log(`[${new Date().toISOString()}] SEED INFO: Payment processed for registration`, {
        programId,
        amount: amountVisa,
        registrationId: registration.referenceId,
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] SEED ERROR: Failed to seed registration for program ${programId}`, error);
      throw error;
    }
  }
}
