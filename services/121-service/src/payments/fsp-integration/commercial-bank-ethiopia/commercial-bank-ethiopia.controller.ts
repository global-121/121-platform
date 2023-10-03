import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommercialBankEthiopiaService } from './commercial-bank-ethiopia.service';
import { CommercialBankEthiopiaValidationData } from './dto/commercial-bank-ethiopia-transfer-payload.dto';

@ApiTags('callbacks/commercialBankEthiopia')
// TODO: REFACTOR: rename to callbacks/commercialBankEthiopia
@Controller('payments/commercialBankEthiopia')
export class CommercialBankEthiopiaController {
  public constructor(
    private commercialBankEthiopiaService: CommercialBankEthiopiaService,
  ) {}

  @ApiOperation({
    summary: 'validate all persons affected that are in this program.',
  })
  @ApiResponse({ status: 201, description: 'validated' })
  @ApiParam({ name: 'programId', required: true, type: 'integer' })
  @Get('validate-persons-affected/:programId')
  public async notificationCallback(
    @Param('programId') programId: number,
  ): Promise<CommercialBankEthiopiaValidationData[]> {
    return await this.commercialBankEthiopiaService.sendValidationPerPa(
      Number(programId),
    );
  }
}
