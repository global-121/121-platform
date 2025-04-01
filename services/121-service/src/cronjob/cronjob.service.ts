import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

function shouldBeEnabled(envVariable: string | undefined): boolean {
  return !!envVariable && envVariable.toLowerCase() === 'true';
}

@Injectable()
export class CronjobService {
  private httpService = new CustomHttpService(new HttpService());
  private axiosCallsService = new AxiosCallsService();

  @Cron(CronExpression.EVERY_10_MINUTES, {
    disabled: !shouldBeEnabled(
      process.env.CRON_INTERSOLVE_VOUCHER_CANCEL_FAILED_CARDS,
    ),
  })
  public async cronCancelByRefposIntersolve(): Promise<{
    url: string;
    responseStatus: number;
  }> {
    // This function periodically checks if some of the IssueCard calls failed and tries to cancel them
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/intersolve-voucher/cancel`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    const response: AxiosResponse = await this.httpService.post(
      url,
      {},
      headers,
    );
    return { url, responseStatus: response.status }; // Only used for testing purposes; this method is then called from the controller
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    disabled: !shouldBeEnabled(
      process.env.CRON_CBE_ACCOUNT_ENQUIRIES_VALIDATION,
    ),
  })
  public async cronValidateCommercialBankEthiopiaAccountEnquiries(): Promise<{
    url: string;
    responseStatus: number;
  }> {
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/commercial-bank-ethiopia/account-enquiries`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    const response: AxiosResponse = await this.httpService.put(
      url,
      {},
      headers,
    );
    return { url, responseStatus: response.status }; // Only used for testing purposes; this method is then called from the controller
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    disabled: !shouldBeEnabled(
      process.env.CRON_INTERSOLVE_VOUCHER_CACHE_UNUSED_VOUCHERS,
    ),
  })
  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(): Promise<{
    url: string;
    responseStatus: number;
  }> {
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/intersolve-voucher/unused-vouchers`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    const response: AxiosResponse = await this.httpService.patch(
      url,
      {},
      headers,
    );
    return { url, responseStatus: response.status }; // Only used for testing purposes; this method is then called from the controller
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    disabled: !shouldBeEnabled(
      process.env.CRON_INTERSOLVE_VISA_UPDATE_WALLET_DETAILS,
    ),
  })
  public async cronRetrieveAndUpdateVisaData(): Promise<{
    url: string;
    responseStatus: number;
  }> {
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const accessToken = await this.axiosCallsService.getAccessToken();
    const programIdVisa = 3;
    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programIdVisa}/financial-service-providers/intersolve-visa`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    const response: AxiosResponse = await this.httpService.patch(
      url,
      {},
      headers,
    );
    return { url, responseStatus: response.status }; // Only used for testing purposes; this method is then called from the controller
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON, {
    disabled: !shouldBeEnabled(
      process.env.CRON_INTERSOLVE_VOUCHER_SEND_WHATSAPP_REMINDERS,
    ),
  })
  public async cronSendWhatsappReminders(): Promise<{
    url: string;
    responseStatus: number;
  }> {
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/intersolve-voucher/send-reminders`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    const response: AxiosResponse = await this.httpService.post(
      url,
      {},
      headers,
    );
    return { url, responseStatus: response.status }; // Only used for testing purposes; this method is then called from the controller
  }

  // Nedbank's systems are not available between 0:00 and 3:00 at night South Africa time
  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    disabled: !shouldBeEnabled(process.env.CRON_NEDBANK_VOUCHERS),
  })
  public async cronDoNedbankReconciliation(): Promise<{
    url: string;
    responseStatus: number;
  }> {
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/nedbank`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    const response: AxiosResponse = await this.httpService.patch(
      url,
      {},
      headers,
    );

    return { url, responseStatus: response.status }; // Only used for testing purposes; this method is then called from the controller
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    disabled: !shouldBeEnabled(process.env.CRON_GET_DAILY_EXCHANGE_RATES),
  })
  public async cronGetDailyExchangeRates(): Promise<{
    url: string;
    responseStatus: number;
  }> {
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/exchange-rates`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    const response: AxiosResponse = await this.httpService.put(
      url,
      {},
      headers,
    );
    return { url, responseStatus: response.status }; // Only used for testing purposes; this method is then called from the controller
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    disabled: !shouldBeEnabled(
      process.env.CRON_INTERSOLVE_VOUCHER_REMOVE_DEPRECATED_IMAGE_CODES,
    ),
  })
  public async cronRemoveDeprecatedImageCodes(): Promise<{
    url: string;
    responseStatus: number;
  }> {
    // Removes image codes older than one day as they're no longer needed after Twilio has downloaded them
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/intersolve-voucher/deprecated-image-codes`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    const response: AxiosResponse = await this.httpService.delete(url, headers);
    return { url, responseStatus: response.status }; // Only used for testing purposes; this method is then called from the controller
  }

  public getAllMethodNames(): string[] {
    const prototype = Object.getPrototypeOf(this);
    const methodNames = Object.getOwnPropertyNames(prototype)
      .filter((name) => {
        const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
        return (
          descriptor &&
          typeof descriptor.value === 'function' &&
          name !== 'constructor'
        );
      })
      // Filter out this method.
      .filter((name) => name !== 'getAllMethodNames');
    return methodNames;
  }
}
