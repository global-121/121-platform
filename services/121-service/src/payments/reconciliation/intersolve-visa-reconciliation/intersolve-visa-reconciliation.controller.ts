import { Controller, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { IntersolveVisaReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-visa-reconciliation/intersolve-visa-reconciliation.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/intersolve-visa')
@Controller()
export class IntersolveVisaReconciliationController {
  public constructor(
    private intersolveVisaReconciliationService: IntersolveVisaReconciliationService,
    private azureLogService: AzureLogService,
  ) {}

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
  public async retrieveAndUpdateAllCards(): Promise<void> {
    console.info('Start: Intersolve-Visa - retrieveAndUpdateAllCards');
    void this.intersolveVisaReconciliationService
      .retrieveAndUpdateAllWalletsAndCards()
      .catch((error) => {
        console.error(
          'Error: Intersolve-Visa - retrieveAndUpdateAllCards',
          error,
        );
        this.azureLogService.logError(error, true);
      })
      .finally(() => {
        console.info('Complete: Intersolve-Visa - retrieveAndUpdateAllCards');
      });
  }
}
