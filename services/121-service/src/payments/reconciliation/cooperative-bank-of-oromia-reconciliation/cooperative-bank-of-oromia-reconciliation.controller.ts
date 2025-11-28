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

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CooperativeBankOfOromiaReconciliationService } from '@121-service/src/payments/reconciliation/cooperative-bank-of-oromia-reconciliation/cooperative-bank-of-oromia-reconciliation.service';
import { CooperativeBankOfOromiaAccountValidationReportDto } from '@121-service/src/payments/reconciliation/cooperative-bank-of-oromia-reconciliation/dtos/cooperative-bank-of-oromia-account-validation-report.dto';
import { CooperativeBankOfOromiaAccountValidationReportRecordDto } from '@121-service/src/payments/reconciliation/cooperative-bank-of-oromia-reconciliation/dtos/cooperative-bank-of-oromia-account-validation-report-record.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/cooperative-bank-of-oromia')
@Controller()
export class CooperativeBankOfOromiaReconciliationController {
  public constructor(
    private cooperativeBankOfOromiaReconciliationService: CooperativeBankOfOromiaReconciliationService,
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
  @Put(
    'programs/:programId/fsps/cooperative-bank-of-oromia/account-validations',
  )
  public async retrieveAndUpsertAccountValidationsForProgram(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<number> {
    return this.cooperativeBankOfOromiaReconciliationService.retrieveAndUpsertAccountValidationsForProgram(
      programId,
    );
  }

  @AuthenticatedUser({
    permissions: [PermissionEnum.PaymentFspInstructionREAD],
  })
  @ApiOperation({
    summary:
      '[SCOPED] Returns a list of Registrations with the latest retrieved account validation data from Cooperative Bank of Oromia',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'An array of Registrations with the latest retrieved account validation data - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: CooperativeBankOfOromiaAccountValidationReportRecordDto,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Get(
    'programs/:programId/fsps/cooperative-bank-of-oromia/account-validations',
  )
  public async getAccountValidations(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<CooperativeBankOfOromiaAccountValidationReportDto> {
    return await this.cooperativeBankOfOromiaReconciliationService.getAccountValidationReport(
      programId,
    );
  }
}
