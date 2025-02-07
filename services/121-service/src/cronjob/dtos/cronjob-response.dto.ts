import { ApiProperty } from '@nestjs/swagger';

export class CronjobResponseDto {
  @ApiProperty({ example: 'cronGetDailyExchangeRates' })
  public readonly methodName: string;
  @ApiProperty({ example: 'http://localhost:3000/api/exchange-rates' })
  public readonly url: string;
  @ApiProperty({ example: 200 })
  public readonly responseStatus: number;
}
