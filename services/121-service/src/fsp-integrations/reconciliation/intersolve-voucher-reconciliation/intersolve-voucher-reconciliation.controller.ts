import {
  Body,
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { IntersolveVoucherJobDetails } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/dto/job-details.dto';
import { IntersolveVoucherReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/intersolve-voucher')
@Controller()
export class IntersolveVoucherReconciliationController {
  public constructor(
    private intersolveVoucherReconciliationService: IntersolveVoucherReconciliationService,
    private azureLogService: AzureLogService,
  ) {}

  //TODO: mention this in WORKFLOWS?
  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Start a retrieve and update of voucher balances of a program. Can be manually used my admin user if needed',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Voucher update job started',
  })
  @Patch('/programs/:programId/fsps/intersolve-voucher/all')
  public async createJob(
    @Body() jobDetails: IntersolveVoucherJobDetails,
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<void> {
    await this.intersolveVoucherReconciliationService.getAndUpdateBalancesForProgram(
      programId,
      jobDetails.name,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: '[CRON] Cache unused vouchers',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Cached unused vouchers',
  })
  @Patch('/fsps/intersolve-voucher/unused-vouchers')
  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(): Promise<void> {
    console.info(
      'Start: Intersolve-Voucher -  cronRetrieveAndUpdatedUnusedIntersolveVouchers',
    );
    this.intersolveVoucherReconciliationService
      .cronRetrieveAndUpdatedUnusedIntersolveVouchers()
      .finally(() => {
        console.info(
          'Complete: Intersolve-Voucher - cronRetrieveAndUpdatedUnusedIntersolveVouchers',
        );
      })
      .catch((error) => {
        console.error(
          'Error: Intersolve-Voucher - cronRetrieveAndUpdatedUnusedIntersolveVouchers',
          error,
        );
        this.azureLogService.logError(error, true);
      });
  }
}
