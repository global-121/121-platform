import { Controller, HttpStatus, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { NedbankReconciliationService } from '@121-service/src/reconciliation/nedbank-reconciliation/nedbank-reconciliation.service';

@Controller()
export class NedbankReconciliationController {
  public constructor(
    private nedbankReconciliationService: NedbankReconciliationService,
  ) {}
  @ApiTags('financial-service-providers/nedbank')
  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Retrieve and update Nedbank vouchers and update transaction statuses',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Nedbank vouchers and transaction update process started',
  })
  @Patch('financial-service-providers/nedbank')
  public async doNedbankReconciliation(): Promise<void> {
    console.info('Started: Nedbank Reconciliation');
    this.nedbankReconciliationService
      .doNedbankReconciliation()
      .then(() => {
        console.info('Complete: Nedbank Reconciliation');
        return;
      })
      .catch((error) => {
        console.error(`Failed: Nedbank Reconciliation - ${error}`);
      });
  }
}
