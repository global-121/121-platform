import {
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { OnafriqTransactionCallbackDto } from '@121-service/src/fsp-integrations/reconciliation/onafriq/dtos/onafriq-transaction-callback.dto';
import { OnafriqReconciliationReport } from '@121-service/src/fsp-integrations/reconciliation/onafriq/interfaces/onafriq-reconciliation-report.interface';
import { OnafriqReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/onafriq/onafriq-reconciliation.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { NoUserAuthenticationEndpoint } from '@121-service/src/guards/no-user-authentication.decorator';
import { AnyValidBody } from '@121-service/src/registration/validators/any-valid-body.validator';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/onafriq')
@Controller('fsps/onafriq')
export class OnafriqReconciliationController {
  public constructor(
    private onafriqReconciliationService: OnafriqReconciliationService,
  ) {}

  @SkipThrottle()
  @NoUserAuthenticationEndpoint(
    '[EXTERNALLY USED] Notification callback used by Onafriq to notify status of transaction to us.',
  )
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
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    description: `Use format: ${new Date().toISOString()}`,
    type: 'string',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description: `Use format: ${new Date().toISOString()}`,
    type: 'string',
  })
  @Post('reconciliation-report/:programId')
  public async generateReconciliationReport(
    @Param('programId', ParseIntPipe) programId: number,
    @Query('fromDate') fromDate: Date,
    @Query('toDate') toDate: Date,
  ): Promise<OnafriqReconciliationReport[]> {
    if (toDate && fromDate && toDate <= fromDate) {
      const errors = 'toDate must be greater than fromDate';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }
    return await this.onafriqReconciliationService.generateAndSendReconciliationReportYesterday(
      {
        programId,
        toDate,
        fromDate,
      },
    );
  }
}
