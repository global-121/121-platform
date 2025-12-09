import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import { env } from '@121-service/src/env';
import {
  CustomHttpService,
  Header,
} from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

type cronReturn = Promise<
  | {
      url: string;
      responseStatus: HttpStatus;
    }
  | false
>;

/*
NestJS can run actual code inside methods decorated with @Cron. Because of scope
the 121 Platform cannot do that. So instead, and in kind of a roundabout way, we
call 121 Platform endpoints that then do the actual work.
*/

@Injectable()
export class CronjobInitiateService {
  private httpService = new CustomHttpService(new HttpService());
  private axiosCallsService = new AxiosCallsService();
  private currentlyRunningCronjobName: string;

  @Cron(CronExpression.EVERY_10_MINUTES, {
    disabled: !env.CRON_INTERSOLVE_VOUCHER_CANCEL_FAILED_CARDS,
  })
  public async cronCancelByRefposIntersolve(cronJobMethodName): cronReturn {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // This function periodically checks if some of the IssueCard calls failed and tries to cancel them
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/intersolve-voucher/cancel`;
    return await this.callEndpoint(url, 'post', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    disabled: !env.CRON_CBE_ACCOUNT_ENQUIRIES_VALIDATION,
  })
  public async cronValidateCommercialBankEthiopiaAccounts(
    cronJobMethodName,
  ): cronReturn {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/commercial-bank-ethiopia/accounts`;
    return await this.callEndpoint(url, 'put', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    disabled: !env.CRON_COOPERATIVE_BANK_OF_OROMIA_ACCOUNT_VALIDATIONS,
  })
  public async cronValidateCooperativeBankOfOromiaAccounts(
    cronJobMethodName,
  ): cronReturn {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/cooperative-bank-of-oromia/accounts`;
    return await this.callEndpoint(url, 'put', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    disabled: !env.CRON_INTERSOLVE_VOUCHER_CACHE_UNUSED_VOUCHERS,
  })
  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(
    cronJobMethodName,
  ): cronReturn {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/intersolve-voucher/unused-vouchers`;
    return await this.callEndpoint(url, 'patch', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    disabled: !env.CRON_INTERSOLVE_VISA_UPDATE_WALLET_DETAILS,
  })
  public async cronRetrieveAndUpdateVisaData(cronJobMethodName): cronReturn {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have

    const url = `${baseCronUrl}/fsps/intersolve-visa`;
    return await this.callEndpoint(url, 'patch', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON, {
    disabled: !env.CRON_INTERSOLVE_VOUCHER_SEND_WHATSAPP_REMINDERS,
  })
  public async cronSendWhatsappReminders(cronJobMethodName): cronReturn {
    const { baseCronUrl: baseUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseUrl}/fsps/intersolve-voucher/send-reminders`;
    return await this.callEndpoint(url, 'post', headers);
  }

  // Nedbank's systems are not available between 0:00 and 3:00 at night South Africa time
  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    disabled: !env.CRON_NEDBANK_VOUCHERS,
  })
  public async cronDoNedbankReconciliation(cronJobMethodName): cronReturn {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/nedbank`;
    return await this.callEndpoint(url, 'patch', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    disabled: !env.CRON_GET_DAILY_EXCHANGE_RATES,
  })
  public async cronGetDailyExchangeRates(cronJobMethodName): cronReturn {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    const url = `${baseCronUrl}/exchange-rates`;
    return await this.callEndpoint(url, 'put', headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    disabled: !env.CRON_INTERSOLVE_VOUCHER_REMOVE_DEPRECATED_IMAGE_CODES,
  })
  public async cronRemoveDeprecatedImageCodes(cronJobMethodName): cronReturn {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Removes image codes older than one day as they're no longer needed after Twilio has downloaded them
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/intersolve-voucher/deprecated-image-codes`;
    return await this.callEndpoint(url, 'delete', headers);
  }

  // Needs to run before 8AM so that the report is ready for the Onafriq reconciliation team to review.
  @Cron(CronExpression.EVERY_DAY_AT_6AM, {
    disabled: !env.CRON_ONAFRIQ_RECONCILIATION_REPORT,
  })
  public async cronSendReconciliationReport(cronJobMethodName): cronReturn {
    const { baseCronUrl, headers } =
      await this.prepareCronJobRun(cronJobMethodName);
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const url = `${baseCronUrl}/fsps/onafriq/reconciliation-report`;
    return await this.callEndpoint(url, 'post', headers);
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
    return this.axiosCallsService.accessTokenToHeaders(accessToken);
  }

  // Separate function: easier to test.
  private async callEndpoint(
    url: string,
    method: 'put' | 'patch' | 'post' | 'delete',
    headers: Header[],
  ): Promise<cronReturn> {
    // Some cronjobs can take 6+ hours. We get "499" errors when the HTTP
    // requests to start those jobs takes too long and times out.
    // Most of the errors in cronjobs will occur in the code doing the actual
    // work which is separate from here. Here we're actually only interested in
    // "did we correctly start the cronjob?"
    // To stop waiting for a response we Promise.race with a 30 second timeout.
    // If the request takes longer than 30 seconds, we assume *here* it
    // succeeded. (Errors can still occur of course but they will be logged in
    // the actual cronjob code)
    let response: AxiosResponse | undefined;
    const timeoutMs = 30_000;
    try {
      const requestPromise =
        method === 'delete'
          ? this.httpService[method](url, headers)
          : this.httpService[method](url, {}, headers);
      const timeoutPromise = new Promise<undefined>((resolve) => {
        setTimeout(() => resolve(undefined), timeoutMs);
      });
      response = (await Promise.race([requestPromise, timeoutPromise])) as
        | AxiosResponse
        | undefined;
    } catch (error) {
      throw new Error(
        `While running cronjob "${this.currentlyRunningCronjobName}" an error occurred during a request: ${error.toString()}`,
      );
    }
    // We could move this to a separate function, but that makes each cronjob a
    // bit uglier.
    this.currentlyRunningCronjobName = '';
    // If no response, assume success (status 200)
    // Only reason we return something here is because we want to test it.
    return { url, responseStatus: response?.status ?? HttpStatus.OK };
  }
}
