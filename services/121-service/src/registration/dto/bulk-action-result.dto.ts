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
  public readonly programFspConfigurationNames: string[];
}

export class BulkActionResultPaymentDto extends BulkActionResultRetryPaymentDto {
  @ApiProperty({ example: 9 })
  public sumPaymentAmountMultiplier: number;

  @ApiProperty({ example: 1 })
  public id?: number; // Optional, only if payment was created
}
