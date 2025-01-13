import { Controller, HttpStatus, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { NedbankReconciliation } from '@121-service/src/reconciliation/nedbank-reconciliation/nedbank-reconciliation.service';

@Controller()
export class NeddbankReconciliationController {
  public constructor(
    private nedbankReconciliationService: NedbankReconciliation,
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
  public async cronDoNedbankReconciliation(): Promise<void> {
    console.info('CronjobService - Started: Nedbank Reconciliation');
    this.nedbankReconciliationService
      .cronDoNedbankReconciliation()
      .then(() => {
        console.info('CronjobService - Complete: Nedbank Reconciliation');
        return;
      })
      .catch((error) => {
        throw new Error(
          `CronjobService - Failed: Nedbank Reconciliation - ${error}`,
        );
      });
  }
}
