import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ExchangeRatesMockService } from '@mock-service/src/exchange-rates/exchange-rates-mock.service';
import { ExchangeRateApiResponse } from '@mock-service/src/exchange-rates/exchange-rates-mock.service';

@ApiTags('exchange-rates')
@Controller('exchange-rates')
export class ExchangeRatesMockController {
  public constructor(
    private readonly exchangeRatesMockService: ExchangeRatesMockService,
  ) {}

  @ApiOperation({ summary: 'Exchange rates' })
  @Get()
  public async getCurrencies(): Promise<ExchangeRateApiResponse[]> {
    return this.exchangeRatesMockService.getCurrencies();
  }
}
