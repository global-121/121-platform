import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from './commercial-bank-ethiopia-account-enquiries.entity';
import { CommercialBankEthiopiaService } from './commercial-bank-ethiopia.service';
import { CommercialBankEthiopiaValidationData } from './dto/commercial-bank-ethiopia-transfer-payload.dto';

@ApiTags('financial-service-providers/commercial-bank-ethiopia')
@Controller()
export class CommercialBankEthiopiaController {
  public constructor(
    private commercialBankEthiopiaService: CommercialBankEthiopiaService,
  ) {}

  @ApiOperation({
    summary: 'validate all persons affected that are in this program.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of PAs with their validation status',
    type: [CommercialBankEthiopiaValidationData],
  })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Get(
    'programs/:programId/financial-service-providers/commercial-bank-ethiopia/account-enquiries',
  )
  public async getValidated(
    @Param('programId') programId: number,
  ): Promise<CommercialBankEthiopiaAccountEnquiriesEntity[]> {
    return await this.commercialBankEthiopiaService.getAllPaValidations(
      Number(programId),
    );
  }

  @ApiOperation({
    summary: 'validate all persons affected that are in this program.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of PAs with their validation status',
    type: [CommercialBankEthiopiaValidationData],
  })
  @Get(
    'programs/:programId/financial-service-providers/commercial-bank-ethiopia/account-enquiries/validate',
  )
  public async validate(): Promise<void> {
    return this.commercialBankEthiopiaService.sendValidationPerPa();
  }
}
