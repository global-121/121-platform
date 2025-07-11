import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { OnafriqTransactionCallbackDto } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/dtos/onafriq-transaction-callback.dto';
import { OnafriqReconciliationService } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/onafriq-reconciliation.service';
import { AnyValidBody } from '@121-service/src/registration/validators/any-valid-body.validator';

@ApiTags('fsps/onafriq')
@Controller('fsps/onafriq')
export class OnafriqReconciliationController {
  public constructor(
    private onafriqReconciliationService: OnafriqReconciliationService,
  ) {}

  @SkipThrottle()
  @ApiOperation({
    summary:
      '[EXTERNALLY USED] Notification callback used by Onafriq to notify status of transaction to us. Update if needed via /fsps/onafriq/webhook/subscribe endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Callback processed successfully.',
  })
  @ApiBody({
    description: 'Onafriq transaction callback data',
    type: OnafriqTransactionCallbackDto,
  })
  @HttpCode(HttpStatus.OK) // NOTE: Onafriq internally labels the callback as success on status 200
  @Post('callback')
  public async processTransactionCallback(
    @AnyValidBody() onafriqTransactionCallback: OnafriqTransactionCallbackDto, // We cannot control the structure of the callback data, so we use AnyValidBody
  ): Promise<void> {
    await this.onafriqReconciliationService.processTransactionCallback(
      onafriqTransactionCallback,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Generate Onafriq reconciliation data and send to Onafriq SFTP (Returned csv is just used for testing purposes)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reconciliation report generated and sent successfully.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('reconciliation-report')
  public async generateReconciliationReport(
    @Res() res: Response,
    @Query() isTest = false,
  ): Promise<void> {
    const { filename, csv } =
      await this.onafriqReconciliationService.generateAndSendReconciliationReportYesterday(
        isTest,
      );
    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csv);
  }
}
