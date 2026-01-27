import {
  Body,
  Controller,
  Delete,
  HttpCode,
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
import { RemoveDeprecatedImageCodesDto } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/dto/remove-deprecated-image-codes-dto';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';

@ApiTags('cronjobs')
@Controller('cronjobs')
@UseGuards(AuthenticatedUserGuard)
export class CronjobController {
  constructor(
    private readonly cronjobInitiateService: CronjobInitiateService,
    private readonly cronjobExecutionService: CronjobExecutionService, // Assuming this is a service to execute cron jobs
  ) {}

  @ApiOperation({
    summary: '[CRON] Cancel by refpos',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vouchers canceled by refpos',
  })
  @AuthenticatedUser({ isAdmin: true })
  @Post('/fsps/intersolve-voucher/cancel')
  public async cancelByRefPos(): Promise<void> {
    await this.cronjobExecutionService.cronCancelByRefposIntersolve();
  }

  @ApiOperation({
    summary:
      '[CRON] Get and store account enquiry data from Commercial Bank of Ethiopia for all registrations in all programs.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Done retrieving and updating/inserting enquiry data for all registrations in all programs.',
  })
  @AuthenticatedUser({ isAdmin: true })
  @Put('fsps/commercial-bank-ethiopia/accounts')
  public async cronValidateCommercialBankEthiopiaAccountEnquiries(): Promise<void> {
    await this.cronjobExecutionService.cronValidateCommercialBankEthiopiaAccounts();
  }

  @ApiOperation({
    summary:
      '[CRON] Get and store account validation data from Cooperative Bank of Oromia for all registrations in all programs.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Done retrieving and updating/inserting validation data for all registrations in all programs.',
  })
  @AuthenticatedUser({ isAdmin: true })
  @Put('fsps/cooperative-bank-of-oromia/accounts')
  public async cronDoCooperativeBankOfOromiaAccountValidation(): Promise<void> {
    await this.cronjobExecutionService.cronValidateCooperativeBankOfOromiaAccounts();
  }

  @ApiOperation({
    summary: '[CRON] Cache unused vouchers',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cached unused vouchers',
  })
  @AuthenticatedUser({ isAdmin: true })
  @Patch('/fsps/intersolve-voucher/unused-vouchers')
  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(): Promise<void> {
    await this.cronjobExecutionService.cronRetrieveAndUpdatedUnusedIntersolveVouchers();
  }

  @ApiOperation({
    summary:
      '[CRON] Retrieve and update all Visa balance, spent this month and cards data for all programs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Data retrieved from Intersolve and entities updated for all programs.',
  })
  @AuthenticatedUser({ isAdmin: true })
  @Patch('/fsps/intersolve-visa/')
  public async cronRetrieveAndUpdateVisaData(): Promise<void> {
    await this.cronjobExecutionService.cronRetrieveAndUpdateVisaData();
  }

  @ApiOperation({
    summary: '[CRON] Send WhatsApp reminders',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sent WhatsApp reminders',
  })
  @AuthenticatedUser({ isAdmin: true })
  @Post('/fsps/intersolve-voucher/send-reminders')
  public async cronSendWhatsappReminders(): Promise<void> {
    await this.cronjobExecutionService.cronSendWhatsAppReminders();
  }

  @ApiOperation({
    summary:
      '[CRON] Retrieve and update Nedbank vouchers and update transaction statuses',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Nedbank vouchers and transaction update process started',
  })
  @AuthenticatedUser({ isAdmin: true })
  @Patch('fsps/nedbank')
  public async cronDoNedbankReconciliation(): Promise<void> {
    await this.cronjobExecutionService.cronDoNedbankReconciliation();
  }

  @ApiOperation({
    summary:
      '[CRON] GET all exchange rates for all programs and store them in the database',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Get all exchange rates for all programs and store them in the database',
  })
  @AuthenticatedUser({ isAdmin: true })
  @Put('exchange-rates')
  public async cronGetDailyExchangeRates(): Promise<void> {
    await this.cronjobExecutionService.cronGetDailyExchangeRates();
  }

  @ApiOperation({
    summary: '[CRON] Remove deprecated image codes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully removed deprecated image codes',
  })
  @AuthenticatedUser({ isAdmin: true })
  @Delete('/fsps/intersolve-voucher/deprecated-image-codes')
  public async cronRemoveDeprecatedImageCodes(
    @Body() body: RemoveDeprecatedImageCodesDto,
  ): Promise<number | undefined> {
    return await this.cronjobExecutionService.cronRemoveDeprecatedImageCodes(
      body?.mockCurrentDate,
    );
  }

  @ApiOperation({
    summary:
      '[CRON] Generate Onafriq reconciliation data and send to Onafriq SFTP (Returned json is just used for testing purposes)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reconciliation report generated and sent successfully.',
  })
  @HttpCode(HttpStatus.OK)
  @AuthenticatedUser({ isAdmin: true })
  @Post('fsps/onafriq/reconciliation-report')
  public async generateReconciliationReport(): Promise<void> {
    return await this.cronjobExecutionService.cronSendOnafriqReconciliationReport();
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
    console.log('cronJobMethodNames: ', cronJobMethodNames);
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
