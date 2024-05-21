import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.service';
import { CommercialBankEthiopiaValidationReportDto } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-validation-report.dto';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('financial-service-providers/commercial-bank-ethiopia')
@Controller()
export class CommercialBankEthiopiaController {
  public constructor(
    private commercialBankEthiopiaService: CommercialBankEthiopiaService,
  ) {}

  @AuthenticatedUser({
    permissions: [PermissionEnum.PaymentFspInstructionREAD],
  })
  @ApiOperation({
    summary:
      '[SCOPED] Returns a list of Registrations with the latest retrieved account enquiry data from Commercial Bank of Ethiopia',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'An array of Registrations with the latest retrieved account enquiry data - NOTE: this endpoint is scoped, depending on program configuration it only returns/modifies data the logged in user has access to.',
    type: CommercialBankEthiopiaValidationReportDto,
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Get(
    'programs/:programId/financial-service-providers/commercial-bank-ethiopia/account-enquiries',
  )
  public async getValidated(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<CommercialBankEthiopiaValidationReportDto> {
    return await this.commercialBankEthiopiaService.getAllPaValidations(
      programId,
    );
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      'Get and store account enquiry data from Commercial Bank of Ethiopia for all registrations in this program.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Done getting and storing account enquiry data for all registrations in this program.',
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Post(
    'programs/:programId/financial-service-providers/commercial-bank-ethiopia/account-enquiries/validation',
  )
  public async validate(
    @Param('programId', ParseIntPipe)
    programId: number,
  ): Promise<void> {
    return this.commercialBankEthiopiaService.validatePasForProgram(programId);
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] Get and store account enquiry data from Commercial Bank of Ethiopia for all registrations in all programs.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Done getting and storing account enquiry data for all registrations in all programs.',
  })
  @Post(
    'financial-service-providers/commercial-bank-ethiopia/account-enquiries/validation',
  )
  public async validateAllPas(): Promise<void> {
    console.info(
      'CronjobService - Started: validateCommercialBankEthiopiaAccountEnquiries',
    );
    await this.commercialBankEthiopiaService.validateAllPas();
    console.info(
      'CronjobService - Complete: validateCommercialBankEthiopiaAccountEnquiries',
    );
  }
}
