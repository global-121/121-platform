import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { Patch } from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { RunCronjobsResponseDto } from '@121-service/src/cronjob/dtos/run-cronjobs-response.dto';
import { CronjobExecutionService } from '@121-service/src/cronjob/services/cronjob-execution.service';
import { CronjobInitiateService } from '@121-service/src/cronjob/services/cronjob-initiate.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { RemoveDeprecatedImageCodesDto } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/remove-deprecated-image-codes-dto';

@ApiTags('cronjobs')
@Controller('cronjobs')
export class CronjobController {
  constructor(
    private readonly cronjobInitiateService: CronjobInitiateService,
    private readonly cronjobExecutionService: CronjobExecutionService, // Assuming this is a service to execute cron jobs
  ) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Cancel by refpos',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vouchers canceled by refpos',
  })
  @Post('/fsps/intersolve-voucher/cancel')
  public async cancelByRefPos(): Promise<void> {
    await this.cronjobExecutionService.cronCancelByRefposIntersolve();
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Get and store account enquiry data from Commercial Bank of Ethiopia for all registrations in all programs.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Done retrieving and updating/insterting enquiry data for all registrations in all programs.',
  })
  @Put('fsps/commercial-bank-ethiopia/account-enquiries')
  public async retrieveAndUpsertAccountEnquiries(): Promise<void> {
    await this.cronjobExecutionService.cronValidateCommercialBankEthiopiaAccountEnquiries();
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Cache unused vouchers',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cached unused vouchers',
  })
  @Patch('/fsps/intersolve-voucher/unused-vouchers')
  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(): Promise<void> {
    await this.cronjobExecutionService.cronRetrieveAndUpdatedUnusedIntersolveVouchers();
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Retrieve and update all Visa balance, spent this month and cards data for all programs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Data retrieved from Intersolve and entities updated for all programs.',
  })
  @Patch('programs/:programId/fsps/intersolve-visa/')
  public async cronRetrieveAndUpdateVisaData(): Promise<void> {
    await this.cronjobExecutionService.cronRetrieveAndUpdateVisaData();
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Send WhatsApp reminders',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sent WhatsApp reminders',
  })
  @Post('/fsps/intersolve-voucher/send-reminders')
  public async cronSendWhatsappReminders(): Promise<void> {
    await this.cronjobExecutionService.cronSendWhatsappReminders();
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Retrieve and update Nedbank vouchers and update transaction statuses',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Nedbank vouchers and transaction update process started',
  })
  @Patch('fsps/nedbank')
  public async cronDoNedbankReconciliation(): Promise<void> {
    await this.cronjobExecutionService.cronDoNedbankReconciliation();
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] GET all exchange rates for all programs and store them in the database',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Get all exchange rates for all programs and store them in the database',
  })
  @Put('exchange-rates')
  public async cronGetDailyExchangeRates(): Promise<void> {
    await this.cronjobExecutionService.cronGetDailyExchangeRates();
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Remove deprecated image codes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully removed deprecated image codes',
  })
  @Delete('/fsps/intersolve-voucher/deprecated-image-codes')
  public async cronRemoveDeprecatedImageCodes(
    @Body() body: RemoveDeprecatedImageCodesDto,
  ): Promise<number | undefined> {
    return await this.cronjobExecutionService.cronRemoveDeprecatedImageCodes(
      body.mockCurrentDate,
    );
  }

  @ApiOperation({
    summary: 'Initiate all Cron Jobs. Only used for testing.',
  })
  @ApiExcludeEndpoint(!IS_DEVELOPMENT)
  @Patch()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cron Jobs run. See response for details.',
    type: [RunCronjobsResponseDto],
  })
  public async runAllCronjobs(): Promise<RunCronjobsResponseDto[]> {
    const cronJobMethodNames =
      this.cronjobInitiateService.getAllCronJobMethodNames();
    const responses: RunCronjobsResponseDto[] = [];
    for (const cronJobMethodName of cronJobMethodNames) {
      const response =
        await this.cronjobInitiateService[cronJobMethodName](cronJobMethodName);
      responses.push({
        methodName: cronJobMethodName,
        url: response.url,
        responseStatus: response.responseStatus,
      });
    }
    return responses;
  }
}
