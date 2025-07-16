import { Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { OnafriqTransactionCallbackDto } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/dtos/onafriq-transaction-callback.dto';
import { OnafriqReconciliationReport } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/interfaces/onafriq-reconciliation-report.interface';
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
      'Generate Onafriq reconciliation data and send to Onafriq SFTP (Use for testing or manual export). There is a /cronjobs version of this endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reconciliation report generated and sent successfully.',
  })
  @HttpCode(HttpStatus.OK)
  @Post('reconciliation-report')
  public async generateReconciliationReport(
    @Query('isTest') isTest = false,
  ): Promise<OnafriqReconciliationReport[]> {
    if (isTest && !IS_DEVELOPMENT) {
      throw new Error(
        'isTest query parameter can only be used in development environment',
      );
    }
    return await this.onafriqReconciliationService.generateAndSendReconciliationReportYesterday(
      isTest,
    );
  }
}
