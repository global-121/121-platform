import { Controller, UseGuards } from '@nestjs/common';
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
    private readonly exchangeRateService: ExchangeRatesService,
  ) {}

  @AuthenticatedUser({ isAdmin: true })
  @ApiOperation({
    summary: 'Get all exchange rates',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get alls exchange rate for a program',
    type: [GetExchangeRateDto],
  })
  @Get()
  public async getAll(): Promise<GetExchangeRateDto[]> {
    return this.exchangeRateService.getAll();
  }
}
