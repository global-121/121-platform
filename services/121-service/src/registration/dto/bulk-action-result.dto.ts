import { ApiProperty } from '@nestjs/swagger';

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
    example: ['Intersolve-voucher-whatsapp', 'Intersolve-voucher-paper'],
  })
  public readonly programFinancialServiceProviderConfigurationNames: string[];
}

export class BulkActionResultPaymentDto extends BulkActionResultRetryPaymentDto {
  @ApiProperty({ example: 9 })
  public readonly sumPaymentAmountMultiplier: number;
}
