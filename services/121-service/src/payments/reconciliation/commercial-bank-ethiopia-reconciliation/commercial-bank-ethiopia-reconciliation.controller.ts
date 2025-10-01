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
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/commercial-bank-ethiopia')
@Controller()
export class CommercialBankEthiopiaReconciliationController {
  public constructor(
    private commercialBankEthiopiaReconciliationService: CommercialBankEthiopiaReconciliationService,
    private azureLogService: AzureLogService,
  ) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Retrieving and updating/inserting account enquiry data from Commercial Bank of Ethiopia for all registrations in this program.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Done retrieving and updating/inserting account enquiry data for all registrations in this program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Put('programs/:programId/fsps/commercial-bank-ethiopia/account-enquiries')
  public async retrieveAndUpsertAccountEnquiriesForProgram(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<number> {
    return this.commercialBankEthiopiaReconciliationService.retrieveAndUpsertAccountEnquiriesForProgram(
      programId,
    );
  }
}
