import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IntersolveVisaService } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVoucherCronService } from '../payments/fsp-integration/intersolve-voucher/services/intersolve-voucher-cron.service';

@Injectable()
export class CronjobService {
  public constructor(
    private readonly intersolveVoucherCronService: IntersolveVoucherCronService,
    private readonly intersolveVisaService: IntersolveVisaService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  public async cronCancelByRefposIntersolve(): Promise<void> {
    // This function periodically checks if some of the IssueCard calls failed.
    // and tries to cancel the
    console.log('CronjobService - Started: cancelByRefposIntersolve');

    await this.intersolveVoucherCronService.cancelByRefposIntersolve();

    console.log('CronjobService - Complete: cancelByRefposIntersolve');
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  public async cronCacheUnusedVouchers(): Promise<void> {
    console.log('CronjobService - Started: cronCacheUnusedVouchers');

    await this.intersolveVoucherCronService.cacheUnusedVouchers();

    console.log('CronjobService - Complete: cronCacheUnusedVouchers');
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  public async cronUpdateVisaDebitWalletDetails(): Promise<void> {
    console.log('CronjobService - Started: updateVisaDebitWalletDetailsCron');

    await this.intersolveVisaService.updateVisaDebitWalletDetails();

    console.log('CronjobService - Complete: updateVisaDebitWalletDetailsCron');
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  public async cronSendWhatsappReminders(): Promise<void> {
    console.log('CronjobService - Started: cronSendWhatsappReminders');

    await this.intersolveVoucherCronService.sendWhatsappReminders();

    console.log('CronjobService - Complete: cronSendWhatsappReminders');
  }
}
