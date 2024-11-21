import { ApiProperty } from '@nestjs/swagger';

import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

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
      {
        fspName: {
          en: 'Visa debit card',
        },
        fsp: FinancialServiceProviders.intersolveVisa,
      },
    ],
  })
  public readonly fspsInPayment: {
    fspName: LocalizedString;
    fsp: FinancialServiceProviders;
  }[];
}

export class BulkActionResultPaymentDto extends BulkActionResultRetryPaymentDto {
  @ApiProperty({ example: 9 })
  public readonly sumPaymentAmountMultiplier: number;
}
