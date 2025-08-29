import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';
import { CommercialBankEthiopiaValidationReportDto } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-validation-report.dto';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('fsps/commercial-bank-ethiopia')
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
      'An array of Registrations with the latest retrieved account enquiry data - NOTE: this endpoint is scoped, depending on project configuration it only returns/modifies data the logged in user has access to.',
    type: CommercialBankEthiopiaValidationReportDto,
  })
  @ApiParam({ name: 'projectId', required: true, type: 'integer' })
  @Get('projects/:projectId/fsps/commercial-bank-ethiopia/account-enquiries')
  public async getValidated(
    @Param('projectId', ParseIntPipe)
    projectId: number,
  ): Promise<CommercialBankEthiopiaValidationReportDto> {
    return await this.commercialBankEthiopiaService.getAllPaValidations(
      projectId,
    );
  }
}
