import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Patch,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

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
    private readonly cronjobExecutionService: CronjobExecutionService,
  ) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({ summary: '[CRON] Cancel by refpos' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Vouchers canceled by refpos',
  })
  @Post('/fsps/intersolve-voucher/cancel')
  public async cancelByRefPos(@Res() res: Response): Promise<void> {
    await this.accepted(
      () => this.cronjobExecutionService.cronCancelByRefposIntersolve(),
      res,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Get and store account enquiry data from Commercial Bank of Ethiopia for all registrations in all programs.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description:
      'Started retrieving and updating/insterting enquiry data for all registrations in all programs.',
  })
  @Put('fsps/commercial-bank-ethiopia/account-enquiries')
  public async retrieveAndUpsertAccountEnquiries(
    @Res() res: Response,
  ): Promise<void> {
    await this.accepted(
      () =>
        this.cronjobExecutionService.cronValidateCommercialBankEthiopiaAccountEnquiries(),
      res,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Cache unused vouchers',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Caching unused vouchers started',
  })
  @Patch('/fsps/intersolve-voucher/unused-vouchers')
  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(
    @Res() res: Response,
  ): Promise<void> {
    await this.accepted(
      () =>
        this.cronjobExecutionService.cronRetrieveAndUpdatedUnusedIntersolveVouchers(),
      res,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Retrieve and update all Visa balance, spent this month and cards data for all programs',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Visa data retrieval and update process started',
  })
  @Patch('programs/:programId/fsps/intersolve-visa/')
  public async cronRetrieveAndUpdateVisaData(
    @Res() res: Response,
  ): Promise<void> {
    await this.accepted(
      () => this.cronjobExecutionService.cronRetrieveAndUpdateVisaData(),
      res,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Send WhatsApp reminders',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Sending of WhatsApp reminders started',
  })
  @Post('/fsps/intersolve-voucher/send-reminders')
  public async cronSendWhatsappReminders(@Res() res: Response): Promise<void> {
    await this.accepted(
      () => this.cronjobExecutionService.cronSendWhatsappReminders(),
      res,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Retrieve and update Nedbank vouchers and update transaction statuses',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Nedbank vouchers and transaction update process started',
  })
  @Patch('fsps/nedbank')
  public async cronDoNedbankReconciliation(
    @Res() res: Response,
  ): Promise<void> {
    await this.accepted(
      () => this.cronjobExecutionService.cronDoNedbankReconciliation(),
      res,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] GET all exchange rates for all programs and store them in the database',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description:
      'Get all exchange rates for all programs and store them in the database, job started',
  })
  @Put(`exchange-rates`)
  public async cronGetDailyExchangeRates(@Res() res: Response): Promise<void> {
    await this.accepted(
      () => this.cronjobExecutionService.cronGetDailyExchangeRates(),
      res,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Remove deprecated image codes',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Successfully started deprecated image codes job',
  })
  @Delete('/fsps/intersolve-voucher/deprecated-image-codes')
  public async cronRemoveDeprecatedImageCodes(
    @Body() body: RemoveDeprecatedImageCodesDto,
    @Res() res: Response,
  ): Promise<void> {
    await this.accepted(
      () =>
        this.cronjobExecutionService.cronRemoveDeprecatedImageCodes(
          body.mockCurrentDate,
        ),
      res,
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

  private async accepted(
    fn: () => Promise<void>,
    res: Response,
  ): Promise<void> {
    void fn();
    res.status(202).send();
  }
}
