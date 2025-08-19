import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { env } from '@121-service/src/env';
import {
  CustomHttpService,
  Header,
} from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

@Injectable()
export class CronjobInitiateService {
  private httpService = new CustomHttpService(new HttpService());
  private axiosCallsService = new AxiosCallsService();
  private currentlyRunningCronjobName: string;

  @Cron(CronExpression.EVERY_10_MINUTES, {
    disabled: !env.CRON_INTERSOLVE_VOUCHER_CANCEL_FAILED_CARDS,
  })
  public async cronCancelByRefposIntersolve(cronJobMethodName): Promise<void> {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // This function periodically checks if some of the IssueCard calls failed and tries to cancel them
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/intersolve-voucher/cancel`;
    await this.callEndpoint(url, 'post', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    disabled: !env.CRON_CBE_ACCOUNT_ENQUIRIES_VALIDATION,
  })
  public async cronValidateCommercialBankEthiopiaAccountEnquiries(
    cronJobMethodName,
  ): Promise<void> {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/commercial-bank-ethiopia/account-enquiries`;
    await this.callEndpoint(url, 'put', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    disabled: !env.CRON_INTERSOLVE_VOUCHER_CACHE_UNUSED_VOUCHERS,
  })
  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(
    cronJobMethodName,
  ): Promise<void> {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/intersolve-voucher/unused-vouchers`;
    await this.callEndpoint(url, 'patch', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    disabled: !env.CRON_INTERSOLVE_VISA_UPDATE_WALLET_DETAILS,
  })
  public async cronRetrieveAndUpdateVisaData(cronJobMethodName): Promise<void> {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have

    const url = `${baseCronUrl}/fsps/intersolve-visa`;
    await this.callEndpoint(url, 'patch', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON, {
    disabled: !env.CRON_INTERSOLVE_VOUCHER_SEND_WHATSAPP_REMINDERS,
  })
  public async cronSendWhatsappReminders(cronJobMethodName): Promise<void> {
    const { baseCronUrl: baseUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseUrl}/fsps/intersolve-voucher/send-reminders`;
    await this.callEndpoint(url, 'post', headers);
  }

  // Nedbank's systems are not available between 0:00 and 3:00 at night South Africa time
  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    disabled: !env.CRON_NEDBANK_VOUCHERS,
  })
  public async cronDoNedbankReconciliation(cronJobMethodName): Promise<void> {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/nedbank`;
    await this.callEndpoint(url, 'patch', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    disabled: !env.CRON_GET_DAILY_EXCHANGE_RATES,
  })
  public async cronGetDailyExchangeRates(cronJobMethodName): Promise<void> {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    const url = `${baseCronUrl}/exchange-rates`;
    await this.callEndpoint(url, 'put', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    disabled: !env.CRON_INTERSOLVE_VOUCHER_REMOVE_DEPRECATED_IMAGE_CODES,
  })
  public async cronRemoveDeprecatedImageCodes(
    cronJobMethodName,
  ): Promise<void> {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Removes image codes older than one day as they're no longer needed after Twilio has downloaded them
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/intersolve-voucher/deprecated-image-codes`;
    await this.callEndpoint(url, 'delete', headers);
  }

  // Needs to run before 8AM so that the report is ready for the Onafriq reconciliation team to review.
  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    disabled: !env.CRON_ONAFRIQ_RECONCILIATION_REPORT,
  })
  public async cronSendReconciliationReport(cronJobMethodName): Promise<void> {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/onafriq/reconciliation-report`;
    await this.callEndpoint(url, 'post', headers);
  }

  // Used for testing and triggering through Swagger UI.
  public getAllCronJobMethodNames(): string[] {
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
      .filter((name) => name.startsWith('cron'));
    return methodNames;
  }

  // If not initialized correctly no use running the cronjobs.
  private async prepareCronJobRun(
    cronjobName: string,
  ): Promise<{ baseCronUrl: string; headers: Header[] }> {
    this.currentlyRunningCronjobName = cronjobName;
    let headers: Header[];
    try {
      headers = await this.getHeaders();
    } catch (error) {
      // We throw and don't catch so we get a 500 and a notification.
      throw new Error(
        `While running cronjob "${cronjobName}" an authentication error occurred: ${error.toString()}`,
      );
    }
    // Not a network operation so no try/catch.
    const cronPath = 'cronjobs';
    const baseCronUrl = `${await this.axiosCallsService.getBaseUrl()}/${cronPath}`;
    return { baseCronUrl, headers };
  }

  // Separate function: easier to test.
  private async getHeaders(): Promise<Header[]> {
    const accessToken = await this.axiosCallsService.getAccessToken();
    return this.axiosCallsService.accesTokenToHeaders(accessToken);
  }

  // Separate function: easier to test.
  private async callEndpoint(
    url: string,
    method: 'put' | 'patch' | 'post' | 'delete',
    headers: Header[],
  ): Promise<void> {
    try {
      if (method === 'delete') {
        await this.httpService[method](url, headers);
      } else {
        await this.httpService[method](url, {}, headers);
      }
    } catch (error) {
      throw new Error(
        `While running cronjob "${this.currentlyRunningCronjobName}" an error occurred during a request: ${error.toString()}`,
      );
    }
    // We could move this to a separate function, but that makes each cronjob a
    // bit uglier.
    this.currentlyRunningCronjobName = '';
  }
}
