import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger';

import { DEBUG } from '@121-service/src/config';
import { CronjobService } from '@121-service/src/cronjob/cronjob.service';

@Controller('cronjob')
export class CronjobController {
  constructor(private readonly cronjobService: CronjobService) {}

  // ##TODO: Should we protect this endpoint with a secret?
  @ApiOperation({
    summary: 'Runs all Cron Jobs. Only used for testing purposes.',
  })
  @ApiExcludeEndpoint(!DEBUG)
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  public async runAllCronjobs(): Promise<void> {
    // ##TODO: See if we can call all the functions via inspection of the CronjobService
    await this.cronjobService.cronCancelByRefposIntersolve();
    await this.cronjobService.validateCommercialBankEthiopiaAccountEnquiries();
    await this.cronjobService.cronRetrieveAndUpdatedUnusedIntersolveVouchers();
    await this.cronjobService.cronRetrieveAndUpdateVisaData();
    await this.cronjobService.cronSendWhatsappReminders();
    await this.cronjobService.getDailyExchangeRates();
  }
}
