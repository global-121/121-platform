import { Controller, HttpStatus, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { NedbankReconciliationService } from '@121-service/src/payments/reconciliation/nedbank-reconciliation/nedbank-reconciliation.service';

@Controller()
@ApiTags('fsps/nedbank')
export class NedbankReconciliationController {
  public constructor(
    private nedbankReconciliationService: NedbankReconciliationService,
  ) {}
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
  public async doNedbankReconciliation(): Promise<void> {
    console.info('Start: Nedbank Reconciliation');
    this.nedbankReconciliationService
      .doNedbankReconciliation()
      .finally(() => {
        console.info('Complete: Nedbank Reconciliation');
      })
      .catch((error) => {
        console.error(`Failed: Nedbank Reconciliation - ${error}`);
      });
  }
}
