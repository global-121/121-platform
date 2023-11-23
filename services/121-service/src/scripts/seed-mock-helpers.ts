import { HttpService } from '@nestjs/axios';
import { EXTERNAL_API } from '../config';
import { CookieNames } from '../shared/enum/cookie.enums';
import {
  CustomHttpService,
  Header,
} from '../shared/services/custom-http.service';
import { ProgramPhase } from '../shared/enum/program-phase.model';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';

export class SeedMockHelper {
  private httpService = new CustomHttpService(new HttpService());

  private getBaseUrl(): string {
    if (process.env.NODE_ENV === 'development') {
      // If development, use localhost as base url
      return `http://localhost:${process.env.PORT_121_SERVICE}/api`;
    } else {
      return EXTERNAL_API.rootApi;
    }
  }

  private async loginAsAdmin(): Promise<any> {
    const url = `${this.getBaseUrl()}/users/login`;
    console.log('url: ', url);
    return this.httpService.post(url, {
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      password: process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
    });
  }

  private accesTokenToHeaders(accessToken: string): Header[] {
    return [
      {
        name: 'Cookie',
        value: accessToken,
      },
    ];
  }

  public async getAccessToken(): Promise<string> {
    const login = await this.loginAsAdmin();
    console.log('login: ', login.headers['set-cookie']);
    const cookies = login.headers['set-cookie'];
    const accessToken = cookies
      .find((cookie: string) => cookie.startsWith(CookieNames.general))
      .split(';')[0];

    return accessToken;
  }

  public async changePhase(
    programId: number,
    newPhase: ProgramPhase,
    accessToken: string,
  ): Promise<any> {
    const url = `${this.getBaseUrl()}/programs/${programId}`;
    // const headers = [{ Cookie: [accessToken] }];
    const body = { phase: newPhase };
    const headers = this.accesTokenToHeaders(accessToken);

    return await this.httpService.patch(url, body, headers);
  }

  public async importRegistrations(
    programId: number,
    registrations: object[],
    accessToken: string,
  ): Promise<any> {
    const url = `${this.getBaseUrl()}/programs/${programId}/registrations/import`;
    const body = registrations;
    const headers = this.accesTokenToHeaders(accessToken);

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

    const url = `${this.getBaseUrl()}/programs/${programId}/registrations/status?${queryParams.slice(
      0,
      -1,
    )}`;
    const headers = this.accesTokenToHeaders(accessToken);
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
    const url = `${this.getBaseUrl()}/programs/${programId}/metrics/person-affected`;
    const headers = this.accesTokenToHeaders(accessToken);

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

    const url = `${this.getBaseUrl()}/programs/${programId}/payments?${queryParams.slice(
      0,
      -1,
    )}`;
    const headers = this.accesTokenToHeaders(accessToken);
    const body = {
      payment: paymentNr,
      amount: amount,
    };

    return await this.httpService.post(url, body, headers);
  }
}
