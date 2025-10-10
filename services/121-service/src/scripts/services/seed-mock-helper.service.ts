import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { MockSeedFactoryService } from '@121-service/src/scripts/factories/mock-seed-factory.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

@Injectable()
export class SeedMockHelperService {
  private readonly mockSeedFactoryService: MockSeedFactoryService;
  private readonly httpService: CustomHttpService;
  private readonly axiosCallsService: AxiosCallsService;

  constructor(private readonly dataSource: DataSource) {
    this.mockSeedFactoryService = new MockSeedFactoryService(dataSource);
    this.httpService = new CustomHttpService(new HttpService());
    this.axiosCallsService = new AxiosCallsService();
  }

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
    const maxPowerNrMessages = 6; // NOTE: There is a trade-off with maxPowerNrRegistrations here. If that is on 17, then this can be max. 1.
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
        `mockPowerNumberMessages must be a number between ${min} and ${maxPowerNrMessages}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return { powerNrRegistrations, nrPayments, powerNrMessages };
  }

  public async multiplyRegistrations(powerNr: number): Promise<void> {
    await this.mockSeedFactoryService.multiplyRegistrations(powerNr);
  }

  public async extendRelatedDataToAllRegistrations(
    powerNr: number,
    programIds: number[],
  ): Promise<void> {
    await this.mockSeedFactoryService.extendRelatedDataToAllRegistrations(
      powerNr,
      programIds,
    );
  }

  public async multiplyTransactions(
    nrPayments: number,
    programIds: number[],
  ): Promise<void> {
    await this.mockSeedFactoryService.extendPaymentsAndRelatedData(
      nrPayments,
      programIds,
    );
  }

  public async multiplyMessages(powerNr: number): Promise<void> {
    await this.mockSeedFactoryService.multiplyMessages(powerNr);
  }

  public updateDerivedData(): Promise<void> {
    return this.mockSeedFactoryService.updateDerivedData();
  }

  public async updateSequenceNumbers(): Promise<void> {
    await this.mockSeedFactoryService.updateSequenceNumbers();
  }

  public async introduceDuplicates(): Promise<void> {
    await this.mockSeedFactoryService.introduceDuplicates();
  }

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
}
