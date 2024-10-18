import { ApiProperty } from '@nestjs/swagger';

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';

export class BulkActionResultDto {
  @ApiProperty({
    example: 10,
  })
  public readonly totalFilterCount: number;

  @ApiProperty({ example: 8 })
  public readonly applicableCount: number;

  @ApiProperty({ example: 2 })
  public readonly nonApplicableCount: number;
}

export class BulkActionResultRetryPaymentDto extends BulkActionResultDto {
  @ApiProperty({
    example: [
      FinancialServiceProviders.intersolveVisa,
      FinancialServiceProviders.excel,
    ],
  })
  public readonly fspsInPayment: string[];
}

export class BulkActionResultPaymentDto extends BulkActionResultRetryPaymentDto {
  @ApiProperty({ example: 9 })
  public readonly sumPaymentAmountMultiplier: number;
}
