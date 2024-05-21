import { ExchangeRateService } from '@121-service/src/exchange-rate/exchange-rate.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronjobService {
  private httpService = new CustomHttpService(new HttpService());
  private axiosCallsService = new AxiosCallsService();

  constructor(private exchangeRateService: ExchangeRateService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  public async cronCancelByRefposIntersolve(): Promise<void> {
    // This function periodically checks if some of the IssueCard calls failed and tries to cancel them
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/intersolve-voucher/cancel`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    await this.httpService.post(url, {}, headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  public async validateCommercialBankEthiopiaAccountEnquiries(): Promise<void> {
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/commercial-bank-ethiopia/account-enquiries/validation`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    await this.httpService.post(url, {}, headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  public async cronCacheUnusedVouchers(): Promise<void> {
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/intersolve-voucher/cache-unused-vouchers`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    await this.httpService.post(url, {}, headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  public async cronUpdateVisaDebitWalletDetails(): Promise<void> {
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const accessToken = await this.axiosCallsService.getAccessToken();
    const programIdVisa = 3;
    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programIdVisa}/financial-service-providers/intersolve-visa/wallets`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    await this.httpService.patch(url, {}, headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  public async cronSendWhatsappReminders(): Promise<void> {
    // Calling via API/HTTP instead of directly the Service so scope-functionality works, which needs a HTTP request to work which a cronjob does not have
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/intersolve-voucher/send-reminders`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    await this.httpService.post(url, {}, headers);
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  public async getDailyExchangeRates(): Promise<void> {
    console.info('CronjobService - Started: getDailyExchangeRates');

    await this.exchangeRateService.getAndStoreProgramsExchangeRates();

    console.info('CronjobService - Complete: getDailyExchangeRates');
  }
}
