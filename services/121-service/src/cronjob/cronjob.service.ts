import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommercialBankEthiopiaService } from '../payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
import { IntersolveVisaService } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVoucherCronService } from '../payments/fsp-integration/intersolve-voucher/services/intersolve-voucher-cron.service';

@Injectable()
export class CronjobService {
  public constructor(
    private readonly intersolveVoucherCronService: IntersolveVoucherCronService,
    private readonly intersolveVisaService: IntersolveVisaService,
    private readonly commercialBankEthiopiaService: CommercialBankEthiopiaService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  public async cronCancelByRefposIntersolve(): Promise<void> {
    // This function periodically checks if some of the IssueCard calls failed.
    // and tries to cancel the
    console.info('CronjobService - Started: cancelByRefposIntersolve');

    await this.intersolveVoucherCronService.cancelByRefposIntersolve();

    console.info('CronjobService - Complete: cancelByRefposIntersolve');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  public async validateCommercialBankEthiopiaAccountEnquiries(): Promise<void> {
    // This function periodically validate PA`s bank account numbers.
    console.info(
      'CronjobService - Started: validateCommercialBankEthiopiaAccountEnquiries',
    );

    await this.commercialBankEthiopiaService.validateAllPas();

    console.info(
      'CronjobService - Complete: validateCommercialBankEthiopiaAccountEnquiries',
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  public async cronCacheUnusedVouchers(): Promise<void> {
    console.info('CronjobService - Started: cronCacheUnusedVouchers');

    await this.intersolveVoucherCronService.cacheUnusedVouchers();

    console.info('CronjobService - Complete: cronCacheUnusedVouchers');
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  public async cronUpdateVisaDebitWalletDetails(): Promise<void> {
    console.info('CronjobService - Started: updateVisaDebitWalletDetailsCron');

    await this.intersolveVisaService.updateVisaDebitWalletDetails();

    console.info('CronjobService - Complete: updateVisaDebitWalletDetailsCron');
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  public async cronSendWhatsappReminders(): Promise<void> {
    console.info('CronjobService - Started: cronSendWhatsappReminders');

    await this.intersolveVoucherCronService.sendWhatsappReminders();

    console.info('CronjobService - Complete: cronSendWhatsappReminders');
  }
}
