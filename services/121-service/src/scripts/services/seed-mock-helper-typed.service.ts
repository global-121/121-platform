import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { MessageProcessType } from '@121-service/src/notifications/dto/message-job.dto';
import { TwilioStatus } from '@121-service/src/notifications/dto/twilio.dto';
import { NotificationType } from '@121-service/src/notifications/entities/twilio.entity';
import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import {
  MockDataFactoryService,
  MockDataGenerationOptions,
} from '@121-service/src/scripts/factories/mock-data-factory.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

/**
 * Improved SeedMockHelperService that uses type-safe factories instead of raw SQL.
 * This service provides a backwards-compatible interface while using the new factory system internally.
 */
@Injectable()
export class SeedMockHelperServiceTyped {
  private readonly mockDataFactory: MockDataFactoryService;
  private readonly httpService: CustomHttpService;
  private readonly axiosCallsService: AxiosCallsService;

  constructor(private readonly dataSource: DataSource) {
    this.mockDataFactory = new MockDataFactoryService(dataSource);
    this.httpService = new CustomHttpService(new HttpService());
    this.axiosCallsService = new AxiosCallsService();
  }

  /**
   * Validate parameters for data duplication (backwards compatible)
   */
  public async validateParametersForDataDuplication({
    powerNrRegistrationsString,
    nrPaymentsString,
    powerNrMessagesString,
  }: {
    powerNrRegistrationsString?: string;
    nrPaymentsString?: string;
    powerNrMessagesString?: string;
  }): Promise<{
    powerNrRegistrations: number;
    nrPayments: number;
    powerNrMessages: number;
  }> {
    const powerNrRegistrations = Number(powerNrRegistrationsString) || 2;
    const nrPayments = Number(nrPaymentsString) || 2;
    const powerNrMessages = Number(powerNrMessagesString) || 1;

    const min = 1;
    const maxPowerNrRegistrations = 17;
    const maxPowerNrMessages = 6;
    const maxNrPayments = 30;

    if (
      isNaN(powerNrRegistrations) ||
      powerNrRegistrations < min ||
      powerNrRegistrations > maxPowerNrRegistrations
    ) {
      throw new HttpException(
        `mockPowerNumberRegistrations must be a number between ${min} and ${maxPowerNrRegistrations}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (isNaN(nrPayments) || nrPayments < min || nrPayments > maxNrPayments) {
      throw new HttpException(
        `nrPayments must be a number between ${min} and ${maxNrPayments}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      isNaN(powerNrMessages) ||
      powerNrMessages < min ||
      powerNrMessages > maxPowerNrMessages
    ) {
      throw new HttpException(
        `squareNumberBulkMessage must be a number between ${min} and ${maxPowerNrMessages}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return { powerNrRegistrations, nrPayments, powerNrMessages };
  }

  /**
   * Multiply registrations using type-safe factories (replaces raw SQL version)
   */
  public async multiplyRegistrations(powerNr: number): Promise<void> {
    const options = this.getDefaultRegistrationOptions();
    await this.mockDataFactory.multiplyRegistrations(powerNr, options);
  }

  /**
   * Multiply registrations and related payment data using type-safe factories
   */
  public async multiplyRegistrationsAndRelatedPaymentData(
    powerNr: number,
  ): Promise<void> {
    const options = await this.getDefaultMockDataOptions();
    await this.mockDataFactory.multiplyRegistrationsAndRelatedPaymentData(
      powerNr,
      options,
    );
  }

  /**
   * Multiply transactions using type-safe factories
   */
  public async multiplyTransactions(
    nr: number,
    programIds: number[],
  ): Promise<void> {
    await this.mockDataFactory.multiplyTransactions(nr, programIds);
  }

  /**
   * Multiply messages using type-safe factories
   */
  public async multiplyMessages(powerNr: number): Promise<void> {
    const defaultOptions = await this.getDefaultMockDataOptions();
    const messageOptions = {
      ...this.getDefaultMessageOptions(),
      userId: defaultOptions.paymentOptions.defaultUserId,
    };
    await this.mockDataFactory.multiplyMessages(powerNr, messageOptions);
  }

  /**
   * Update sequence numbers using type-safe approach
   */
  public async updateSequenceNumbers(): Promise<void> {
    await this.mockDataFactory.updateSequenceNumbers();
  }

  /**
   * Introduce duplicates using type-safe approach
   */
  public async introduceDuplicates(): Promise<void> {
    await this.mockDataFactory.introduceDuplicates();
  }

  /**
   * Import registrations (unchanged - uses HTTP API)
   */
  public async importRegistrations(
    programId: number,
    registrations: object[],
    accessToken: string,
  ): Promise<any> {
    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}/registrations`;
    const body = registrations;
    const headers = this.axiosCallsService.accessTokenToHeaders(accessToken);

    return await this.httpService.post(url, body, headers);
  }

  /**
   * Change PA status (unchanged - uses HTTP API)
   */
  public async awaitChangePaStatus(
    programId: number,
    referenceIds: string[],
    status: RegistrationStatusEnum,
    accessToken: string,
    filter: Record<string, string> = {},
  ): Promise<any> {
    let queryParams = '';
    if (referenceIds) {
      queryParams += `filter.referenceId=$in:${referenceIds.join(',')}&`;
    }
    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        queryParams += `${key}=${value}&`;
      }
    }

    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}/registrations/status?${queryParams.slice(
      0,
      -1,
    )}`;
    const headers = this.axiosCallsService.accessTokenToHeaders(accessToken);
    const body = {
      status,
      message: null,
    };

    const result = await this.httpService.patch(url, body, headers);
    await this.waitForStatusChangeToComplete(
      programId,
      referenceIds.length,
      status,
      8000,
      accessToken,
    );

    return result;
  }

  /**
   * Wait for status change to complete (unchanged)
   */
  public async waitForStatusChangeToComplete(
    programId: number,
    amountOfRegistrations: number,
    status: string,
    maxWaitTimeMs: number,
    accessToken: string,
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitTimeMs) {
      const paginatedRegistrations = await this.getRegistrations(
        programId,
        ['status'],
        accessToken,
        1,
        undefined,
        {
          'filter.status': `$in:${status}`,
        },
      );

      if (
        paginatedRegistrations &&
        paginatedRegistrations.data &&
        paginatedRegistrations.data.data.length >= amountOfRegistrations
      ) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Get registrations (unchanged - uses HTTP API)
   */
  public async getRegistrations(
    programId: number,
    attributes: string[],
    accessToken: string,
    page?: number,
    limit?: number,
    filter: Record<string, string> = {},
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    attributes.forEach((attr) => queryParams.append('select', attr));
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    Object.keys(filter).forEach((key) => queryParams.append(key, filter[key]));

    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}/registrations?${queryParams}`;
    const headers = this.axiosCallsService.accessTokenToHeaders(accessToken);

    return await this.httpService.get(url, headers);
  }

  /**
   * Do payment (unchanged - uses HTTP API)
   */
  public async doPayment(
    programId: number,
    amount: number,
    referenceIds: string[],
    accessToken: string,
    filter: Record<string, string> = {},
  ): Promise<any> {
    let queryParams = '';
    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        queryParams += `${key}=${value}&`;
      }
    }

    if (referenceIds && referenceIds.length > 0) {
      queryParams += `filter.referenceId=$in:${referenceIds.join(',')}&`;
    }

    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}/payments?${queryParams.slice(
      0,
      -1,
    )}`;
    const headers = this.axiosCallsService.accessTokenToHeaders(accessToken);
    const body = {
      amount,
    };

    return await this.httpService.post(url, body, headers);
  }

  /**
   * Get default registration options for mock data generation
   */
  private getDefaultRegistrationOptions() {
    return {
      programId: 1, // Default program ID
      registrationStatus: RegistrationStatusEnum.included,
      preferredLanguage: LanguageEnum.en,
    };
  }

  /**
   * Get default message options for mock data generation
   */
  private getDefaultMessageOptions() {
    return {
      accountSid: 'AC_test_account_sid',
      from: '+1234567890',
      status: TwilioStatus.delivered,
      type: NotificationType.Sms,
      processType: MessageProcessType.sms,
      contentType: MessageContentType.custom,
    };
  }

  /**
   * Get default options for comprehensive mock data generation
   */
  /**
   * Get default mock data generation options with dynamic program IDs
   */
  private async getDefaultMockDataOptions(): Promise<MockDataGenerationOptions> {
    // Get the actual program IDs that exist in the database
    const programRepository = this.dataSource.getRepository('ProgramEntity');
    const programs = await programRepository.find();
    const programIds = [...new Set(programs.map((p: any) => p.id))]; // Remove duplicates

    if (programIds.length === 0) {
      throw new Error('No programs found in database for mock data generation');
    }

    // Get the first user ID to use for transactions (following original SQL pattern)
    const userRepository = this.dataSource.getRepository('UserEntity');
    const users = await userRepository.find({ take: 1 });
    const defaultUserId = users.length > 0 ? users[0].id : 1;

    return {
      registrationOptions: this.getDefaultRegistrationOptions(),
      messageOptions: {
        ...this.getDefaultMessageOptions(),
        userId: defaultUserId,
      },
      paymentOptions: {
        programIds, // Use actual program IDs without duplicates
        defaultUserId, // Provide default user ID for transactions
      },
    };
  }
}
