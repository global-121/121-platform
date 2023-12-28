import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Admin } from '../../../guards/admin.decorator';
import { AdminAuthGuard } from '../../../guards/admin.guard';
import { Permissions } from '../../../guards/permissions.decorator';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { PermissionEnum } from '../../../user/enum/permission.enum';
import { CommercialBankEthiopiaService } from './commercial-bank-ethiopia.service';
import { CommercialBankEthiopiaValidationReportDto } from './dto/commercial-bank-ethiopia-validation-report.dto';

@UseGuards(PermissionsGuard, AdminAuthGuard)
@ApiTags('financial-service-providers/commercial-bank-ethiopia')
@Controller()
export class CommercialBankEthiopiaController {
  public constructor(
    private commercialBankEthiopiaService: CommercialBankEthiopiaService,
  ) {}

  @Permissions(PermissionEnum.PaymentFspInstructionREAD)
  @ApiOperation({
    summary:
      '[SCOPED] Returns a list of Registrations with the latest retrieved account enquiry data from Commercial Bank of Ethiopia',
  })
  @ApiResponse({
    status: 200,
    description:
      'An array of Registrations with the latest retrieved account enquiry data - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: CommercialBankEthiopiaValidationReportDto,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Get(
    'programs/:programId/financial-service-providers/commercial-bank-ethiopia/account-enquiries',
  )
  public async getValidated(
    @Param('programId') programId: number,
  ): Promise<CommercialBankEthiopiaValidationReportDto> {
    return await this.commercialBankEthiopiaService.getAllPaValidations(
      Number(programId),
    );
  }

  @Admin()
  @ApiOperation({
    summary:
      'Get and store account enquiry data from Commercial Bank of Ethiopia for all registrations in this program.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Done getting and storing account enquiry data for all registrations in this program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(
    'programs/:programId/financial-service-providers/commercial-bank-ethiopia/account-enquiries/validation',
  )
  public async validate(@Param('programId') programId: number): Promise<void> {
    return this.commercialBankEthiopiaService.validatePasForProgram(
      Number(programId),
    );
  }

  @Admin()
  @ApiOperation({
    summary:
      '[CRON] Get and store account enquiry data from Commercial Bank of Ethiopia for all registrations in all programs.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Done getting and storing account enquiry data for all registrations in all programs.',
  })
  @Post(
    'financial-service-providers/commercial-bank-ethiopia/account-enquiries/validation',
  )
  public async validateAllPas(): Promise<void> {
    return this.commercialBankEthiopiaService.validateAllPas();
  }
}
