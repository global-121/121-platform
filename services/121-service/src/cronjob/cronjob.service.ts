import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomHttpService } from '../shared/services/custom-http.service';
import { AxiosCallsService } from '../utils/axios/axios-calls.service';

@Injectable()
export class CronjobService {
  private httpService = new CustomHttpService(new HttpService());
  private axiosCallsService = new AxiosCallsService();

  @Cron(CronExpression.EVERY_10_MINUTES)
  public async cronCancelByRefposIntersolve(): Promise<void> {
    // This function periodically checks if some of the IssueCard calls failed.
    // and tries to cancel them
    console.info('CronjobService - Started: cancelByRefposIntersolve');

    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/intersolve-voucher/cancel`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    await this.httpService.post(url, {}, headers);

    console.info('CronjobService - Complete: cancelByRefposIntersolve');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  public async validateCommercialBankEthiopiaAccountEnquiries(): Promise<void> {
    // This function periodically validate PA`s bank account numbers.
    console.info(
      'CronjobService - Started: validateCommercialBankEthiopiaAccountEnquiries',
    );

    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/commercial-bank-ethiopia/account-enquiries/validation`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    await this.httpService.post(url, {}, headers);

    console.info(
      'CronjobService - Complete: validateCommercialBankEthiopiaAccountEnquiries',
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  public async cronCacheUnusedVouchers(): Promise<void> {
    console.info('CronjobService - Started: cronCacheUnusedVouchers');

    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/intersolve-voucher/cache-unused-vouchers`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    await this.httpService.post(url, {}, headers);

    console.info('CronjobService - Complete: cronCacheUnusedVouchers');
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  public async cronUpdateVisaDebitWalletDetails(): Promise<void> {
    console.info('CronjobService - Started: updateVisaDebitWalletDetailsCron');

    const programIdVisa = 3;
    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/programs/${programIdVisa}/financial-service-providers/intersolve-visa/wallets`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    await this.httpService.patch(url, {}, headers);

    console.info('CronjobService - Complete: updateVisaDebitWalletDetailsCron');
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  public async cronSendWhatsappReminders(): Promise<void> {
    console.info('CronjobService - Started: cronSendWhatsappReminders');

    const accessToken = await this.axiosCallsService.getAccessToken();
    const url = `${this.axiosCallsService.getBaseUrl()}/financial-service-providers/intersolve-voucher/send-reminders`;
    const headers = this.axiosCallsService.accesTokenToHeaders(accessToken);
    await this.httpService.post(url, {}, headers);

    console.info('CronjobService - Complete: cronSendWhatsappReminders');
  }
}
