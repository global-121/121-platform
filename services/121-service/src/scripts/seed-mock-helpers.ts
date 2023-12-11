import { HttpService } from '@nestjs/axios';
import { CustomHttpService } from '../shared/services/custom-http.service';
import { ProgramPhase } from '../shared/enum/program-phase.model';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';
import { AxiosCallsService } from '../utils/axios/axios-calls.service';

export class SeedMockHelper {
  private httpService = new CustomHttpService(new HttpService());
  private axiosCallsService = new AxiosCallsService();

  public async changePhase(
    programId: number,
    newPhase: ProgramPhase,
    accessToken: string,
  ): Promise<any> {
    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}`;
    // const headers = [{ Cookie: [accessToken] }];
    const body = { phase: newPhase };
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);

    return await this.httpService.patch(url, body, headers);
  }

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
      const metrics = await this.personAffectedMetrics(programId, accessToken);
      // If not all transactions are successful, wait for a short interval before checking again
      if (
        metrics.data.pa[status] &&
        metrics.data.pa[status] >= amountOfRegistrations
      ) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  public async personAffectedMetrics(
    programId: number,
    accessToken: string,
  ): Promise<any> {
    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programId}/metrics/person-affected`;
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
