import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { OnafriqTransactionCallbackDto } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/dtos/onafriq-transaction-callback.dto';
import { OnafriqReconciliationService } from '@121-service/src/payments/reconciliation/onafriq-reconciliation/onafriq-reconciliation.service';

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
    status: HttpStatus.CREATED,
    description: 'Notified transaction status',
  })
  @Post('callback')
  public async processTransactionCallback(
    @Body() onafriqTransactionCallback: OnafriqTransactionCallbackDto,
  ): Promise<void> {
    await this.onafriqReconciliationService.processTransactionCallback(
      onafriqTransactionCallback,
    );
  }
}
