import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  public async validate(
    @Param('programId') programId: number,
  ): Promise<CommercialBankEthiopiaValidationData[]> {
    return await this.commercialBankEthiopiaService.sendValidationPerPa(
      Number(programId),
    );
  }
}
