import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';
import { HttpService } from '@nestjs/axios';

export class SeedMockHelper {
  private httpService = new CustomHttpService(new HttpService());
  private axiosCallsService = new AxiosCallsService();

  public async importRegistrations(
    programId: number,
    registrations: object[],
    accessToken: string,
  ): Promise<any> {
    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}/registrations/import`;
    const body = registrations;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);

    return await this.httpService.post(url, body, headers);
  }

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
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    const body = {
      status: status,
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

  public async waitForStatusChangeToComplete(
    programId: number,
    amountOfRegistrations: number,
    status: string,
    maxWaitTimeMs: number,
    accessToken: string,
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitTimeMs) {
      // Get payment transactions
      const paginatedRegistrations = await this.getRegistrations(
        programId,
        ['status'],
        accessToken,
        1,
        null,
        {
          'filter.status': `$in:${status}`,
        },
      );
      // If not all transactions are successful, wait for a short interval before checking again
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
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);

    return await this.httpService.get(url, headers);
  }

  public async doPayment(
    programId: number,
    paymentNr: number,
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
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    const body = {
      payment: paymentNr,
      amount: amount,
    };

    return await this.httpService.post(url, body, headers);
  }
}
