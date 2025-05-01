import { Controller, Put, UseGuards } from '@nestjs/common';
import { Get, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { GetExchangeRateDto } from '@121-service/src/exchange-rates/dtos/get-exchange-rate.dto';
import { ExchangeRatesService } from '@121-service/src/exchange-rates/exchange-rates.service';
import { AuthenticatedUser } from '@121-service/src/guards/authenticated-user.decorator';
import { AuthenticatedUserGuard } from '@121-service/src/guards/authenticated-user.guard';

@UseGuards(AuthenticatedUserGuard)
@ApiTags('exchange-rates')
@Controller('exchange-rates')
export class ExchangeRatesController {
  public constructor(
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Get all exchange rates',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gets all exchange rates for a program',
    type: [GetExchangeRateDto],
  })
  @Get()
  public async getAll(): Promise<GetExchangeRateDto[]> {
    return this.exchangeRatesService.getAll();
  }

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary:
      '[CRON] GET all exchange rates for all programs and store them in the database',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Get all exchange rates for all programs and store them in the database',
  })
  @Put()
  public async retrieveAndStoreAllExchangeRates(): Promise<void> {
    console.info('Start: Exchange-Rates - retrieveAndStoreAllExchangeRates');
    void this.exchangeRatesService
      .retrieveAndStoreAllExchangeRates()
      .finally(() => {
        console.info(
          'Complete: Exchange-Rates - retrieveAndStoreAllExchangeRates',
        );
      });
  }
}
