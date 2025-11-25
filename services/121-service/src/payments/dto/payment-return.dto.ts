import { ApiProperty, PartialType } from '@nestjs/swagger';

import { TransactionViewEntity } from '@121-service/src/payments/transactions/entities/transaction-view.entity';

class CountAndTransferValueDto {
  @ApiProperty({ example: 0 })
  count: number;

  @ApiProperty({ example: 0 })
  transferValue: number;
}

export class PaymentReturnDto {
  @ApiProperty({
    example: { count: 0, transferValue: 0 },
    type: CountAndTransferValueDto,
  })
  success: CountAndTransferValueDto;

  @ApiProperty({
    example: { count: 0, transferValue: 0 },
    type: CountAndTransferValueDto,
  })
  waiting: CountAndTransferValueDto;

  @ApiProperty({
    example: { count: 3, transferValue: 75 },
    type: CountAndTransferValueDto,
  })
  failed: CountAndTransferValueDto;

  @ApiProperty({
    example: { count: 0, transferValue: 0 },
    type: CountAndTransferValueDto,
  })
  pendingApproval: CountAndTransferValueDto;

  @ApiProperty({
    example: { count: 0, transferValue: 0 },
    type: CountAndTransferValueDto,
  })
  approved: CountAndTransferValueDto;

  @ApiProperty({
    type: () => PartialType(TransactionViewEntity),
    isArray: true,
  })
  fsps: Pick<
    TransactionViewEntity,
    | 'programFspConfigurationName'
    | 'programFspConfigurationId'
    | 'programFspConfigurationLabel'
  >[];
}
