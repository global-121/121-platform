import {
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CommercialBankEthiopiaReconciliationService } from '@121-service/src/payments/reconciliation/commercial-bank-ethiopia-reconciliation/commercial-bank-ethiopia-reconciliation.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('financial-service-providers/commercial-bank-ethiopia')
@Controller()
export class CommercialBankEthiopiaReconciliationController {
  public constructor(
    private commercialBankEthiopiaReconciliationService: CommercialBankEthiopiaReconciliationService,
  ) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Retrieving and updating/insterting account enquiry data from Commercial Bank of Ethiopia for all registrations in this program.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Done retrieving and updating/insterting account enquiry data for all registrations in this program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Put(
    'programs/:programId/financial-service-providers/commercial-bank-ethiopia/account-enquiries',
  )
  public async retrieveAndUpsertAccountEnquiriesForProgram(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<void> {
    return this.commercialBankEthiopiaReconciliationService.retrieveAndUpsertAccountEnquiriesForProgram(
      programId,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Get and store account enquiry data from Commercial Bank of Ethiopia for all registrations in all programs.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Done retrieving and updating/insterting enquiry data for all registrations in all programs.',
  })
  @Put('financial-service-providers/commercial-bank-ethiopia/account-enquiries')
  public async retrieveAndUpsertAccountEnquiries(): Promise<void> {
    console.info('Start: CBE - retrieveAndUpsertAccountEnquiries');
    // Don't wait for the result, as that can cause a timeout on the API
    void this.commercialBankEthiopiaReconciliationService
      .retrieveAndUpsertAccountEnquiries()
      .catch((error) => {
        console.error(
          'Error: CBE - retrieveAndUpsertAccountEnquiries',
          error.toString(),
        );
      })
      .finally(() => {
        console.info('Complete: CBE - retrieveAndUpsertAccountEnquiries');
      });
  }
}
