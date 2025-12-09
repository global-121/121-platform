import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CooperativeBankOfOromiaAccountManagementService } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia-account-management/cooperative-bank-of-oromia-account-management.service';
import { CooperativeBankOfOromiaAccountValidationReportDto } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia-account-management/dtos/cooperative-bank-of-oromia-account-validation-report.dto';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/cooperative-bank-of-oromia')
@Controller()
export class CooperativeBankOfOromiaAccountManagementController {
  public constructor(
    private cooperativeBankOfOromiaAccountManagementService: CooperativeBankOfOromiaAccountManagementService,
  ) {}
  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Retrieving and updating/inserting account validation data from Cooperative Bank of Oromia for all registrations in this program.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Done retrieving and updating/inserting account validation data for all registrations in this program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Put('programs/:programId/fsps/cooperative-bank-of-oromia/accounts')
  public async retrieveAndUpsertAccountValidationsForProgram(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<number> {
    return this.cooperativeBankOfOromiaAccountManagementService.retrieveAndUpsertAccountInformationForProgram(
      { programId },
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.RegistrationPersonalREAD],
  })
  @ApiOperation({
    summary:
      '[SCOPED] Returns a list of Registrations with the latest retrieved account validation data from Cooperative Bank of Oromia',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'An array of Registrations with the latest retrieved account validation data - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: CooperativeBankOfOromiaAccountValidationReportDto,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Get('programs/:programId/fsps/cooperative-bank-of-oromia/accounts')
  public async getAccountValidations(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<CooperativeBankOfOromiaAccountValidationReportDto> {
    return await this.cooperativeBankOfOromiaAccountManagementService.getAccountValidationReport(
      { programId },
    );
  }
}
