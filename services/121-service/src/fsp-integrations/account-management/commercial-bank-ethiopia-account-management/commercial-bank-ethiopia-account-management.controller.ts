import {
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CommercialBankEthiopiaAccountManagementService as CommercialBankEthiopiaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/commercial-bank-ethiopia-account-management/commercial-bank-ethiopia-account-management.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/commercial-bank-ethiopia')
@Controller()
export class CommercialBankEthiopiaAccountManagementController {
  public constructor(
    private commercialBankEthiopiaAccountManagementService: CommercialBankEthiopiaAccountManagementService,
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
  @Put('programs/:programId/fsps/commercial-bank-ethiopia/accounts')
  public async retrieveAndUpsertAccountEnquiriesForProgram(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<number> {
    return this.commercialBankEthiopiaAccountManagementService.retrieveAndUpsertAccountEnquiriesForProgram(
      programId,
    );
  }
}
