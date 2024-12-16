import { Controller, HttpStatus, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { FinancialSyncService } from '@121-service/src/financial-sync/financial-sync-service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';

@Controller()
export class FinancialSyncController {
  public constructor(private financialSyncService: FinancialSyncService) {}
  @ApiTags('financial-service-providers/nedbank')
  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Retrieve and update Nedbank voucher and transaction statusses',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cached unused vouchers',
  })
  @Patch('financial-service-providers/nedbank')
  public async syncNedbankVoucherAndTransactionStatusses(): Promise<void> {
    console.info(
      'CronjobService - Started: updateNedbankVoucherAndTransactionStatusses',
    );
    this.financialSyncService
      .syncNedbankVoucherAndTransactionStatusses()
      .then(() => {
        console.info(
          'CronjobService - Complete: updateNedbankVoucherAndTransactionStatusses',
        );
        return;
      })
      .catch((error) => {
        throw new Error(
          `CronjobService - Failed: updateNedbankVoucherAndTransactionStatusses - ${error}`,
        );
      });
  }
}
