import { ApiProperty } from '@nestjs/swagger';

import { EXTERNAL_API } from '@121-service/src/config';

export class RunCronjobsResponseDto {
  @ApiProperty({ example: 'cronGetDailyExchangeRates' })
  public readonly methodName: string;

  @ApiProperty({
    example: `${EXTERNAL_API.rootApi}/exchange-rates`,
  })
  public readonly url: string;

  @ApiProperty({ example: 200 })
  public readonly responseStatus: number;
}
