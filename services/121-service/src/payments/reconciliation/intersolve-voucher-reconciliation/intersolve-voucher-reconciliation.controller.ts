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

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { IntersolveVoucherJobDetails } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/job-details.dto';
import { IntersolveVoucherReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('financial-service-providers/intersolve-voucher')
@Controller()
export class IntersolveVoucherReconciliationController {
  public constructor(
    private intersolveVoucherReconciliationService: IntersolveVoucherReconciliationService,
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
  @Patch(
    '/programs/:programId/financial-service-providers/intersolve-voucher/all',
  )
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
  @Patch('/financial-service-providers/intersolve-voucher/vouchers')
  public async cronRetrieveAndUpdatedUnusedIntersolveVouchers(): Promise<void> {
    console.info(
      'CronjobService - Started: cronRetrieveAndUpdatedUnusedIntersolveVouchers',
    );
    this.intersolveVoucherReconciliationService
      .cronRetrieveAndUpdatedUnusedIntersolveVouchers()
      .then(() => {
        console.info(
          'CronjobService - Complete: cronRetrieveAndUpdatedUnusedIntersolveVouchers',
        );
        return;
      })
      .catch((error) => {
        throw new Error(
          `CronjobService - Failed: cronRetrieveAndUpdatedUnusedIntersolveVouchers - ${error}`,
        );
      });
  }
}
