import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CommercialBankEthiopiaMockService } from '@mock-service/src/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.mock.service';

@ApiTags('fsp/commercial-bank-ethiopia')
@Controller('fsp/commercial-bank-ethiopia')
export class CommercialBankEthiopiaMockController {
  public constructor(
    private readonly CommercialBankEthiopiaMockService: CommercialBankEthiopiaMockService,
  ) {}

  @ApiOperation({ summary: 'Make SOAP call' })
  @Post('/services')
  public createOrder(@Param('xsd') xsd: number, @Body() body: any): any {
    if (xsd === 2) {
      return this.CommercialBankEthiopiaMockService.postCBEValidation(body);
    }
    if (xsd === 4) {
      return this.CommercialBankEthiopiaMockService.postCBETransfer(body);
    }
    if (xsd === 6) {
      return this.CommercialBankEthiopiaMockService.postCBETransaction(body);
    }
  }
}
