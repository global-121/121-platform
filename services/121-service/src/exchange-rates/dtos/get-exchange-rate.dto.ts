import { ApiProperty } from '@nestjs/swagger';

export class GetExchangeRateDto {
  @ApiProperty({ example: 'KES', type: 'string' })
  public currency: string;

  @ApiProperty({ example: '0.00744368', type: 'number' })
  public euroExchangeRate: number;

  @ApiProperty({
    example: '2025-01-15T23:59:59Z',
    type: 'string',
    nullable: true,
  })
  public closeTime: string | null;
}
