import { ApiProperty } from '@nestjs/swagger';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';

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

export class BulkActionResultPaymentDto extends BulkActionResultDto {
  @ApiProperty({
    example: [Fsps.intersolveVoucherWhatsapp, Fsps.intersolveVoucherPaper],
  })
  public readonly programFspConfigurationNames: string[];

  @ApiProperty({ example: 9 })
  public sumPaymentAmountMultiplier: number;

  @ApiProperty({ example: 1 })
  public id?: number; // Optional, only if payment was created
}
