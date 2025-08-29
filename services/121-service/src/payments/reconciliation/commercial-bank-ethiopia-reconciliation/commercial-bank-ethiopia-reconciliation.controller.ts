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
      'Retrieving and updating/insterting account enquiry data from Commercial Bank of Ethiopia for all registrations in this project.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Done retrieving and updating/insterting account enquiry data for all registrations in this project.',
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @Put('projects/:projectId/fsps/commercial-bank-ethiopia/account-enquiries')
  public async retrieveAndUpsertAccountEnquiriesForProject(
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<number> {
    return this.commercialBankEthiopiaReconciliationService.retrieveAndUpsertAccountEnquiriesForProject(
      projectId,
    );
  }
}
