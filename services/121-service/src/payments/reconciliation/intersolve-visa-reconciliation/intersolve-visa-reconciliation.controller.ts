import { Controller, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { IntersolveVisaReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-visa-reconciliation/intersolve-visa-reconciliation.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('financial-service-providers/intersolve-visa')
@Controller()
export class IntersolveVisaReconciliationController {
  public constructor(
    private intersolveVisaReconciliationService: IntersolveVisaReconciliationService,
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
  @Patch('programs/:programId/financial-service-providers/intersolve-visa/')
  public async retrieveAndUpdateAllCards(): Promise<void> {
    console.info(
      'CronjobService - Started: retrieveAndUpdateAllWalletsAndCards',
    );
    await this.intersolveVisaReconciliationService.retrieveAndUpdateAllWalletsAndCards();
    console.info(
      'CronjobService - Complete: retrieveAndUpdateAllWalletsAndCards',
    );
  }
}
