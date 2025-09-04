import { ApiProperty } from '@nestjs/swagger';
import { Relation } from 'typeorm';

import { FspIntegrationType } from '@121-service/src/fsps/enums/fsp-integration-type.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export class TransactionReturnDto {
  @ApiProperty({
    example: '2023-09-28T08:00:10.363Z',
    type: 'string',
    format: 'date-time',
  })
  public paymentDate: Date;
  @ApiProperty({
    example: '2023-09-28T08:00:10.363Z',
    type: 'string',
    format: 'date-time',
  })
  public updated: Date;
  @ApiProperty({ example: 2, type: 'number' })
  public paymentId: number;
  @ApiProperty({ example: '2982g82bdsf89sdsd', type: 'string' })
  public referenceId: string;
  @ApiProperty({ example: TransactionStatusEnum.success, type: 'string' })
  public status: string;
  @ApiProperty({ example: 25, type: 'number' })
  public amount: number;
  @ApiProperty({ example: null, type: 'string', required: false })
  public errorMessage: string;
  @ApiProperty()
  public customData: Record<string, unknown>;
  // FspName is used in the frontend to determine whether a transaction has a voucher
  @ApiProperty({ example: Fsps.excel })
  public fspName: Relation<Fsps>;
  @ApiProperty({ example: 'ironBank' })
  public programFspConfigurationLabel: Relation<LocalizedString>;
  @ApiProperty({ example: { en: 'Iron bank' }, type: 'string' })
  public programFspConfigurationName: string;
  @ApiProperty({
    example: FspIntegrationType.api,
    type: 'string',
  })
  public fspIntegrationType: string;
}

class CountAmountDto {
  @ApiProperty({ example: 0 })
  count: number;

  @ApiProperty({ example: 0 })
  amount: number;
}

export class PaymentReturnDto {
  @ApiProperty({ example: { count: 0, amount: 0 }, type: CountAmountDto })
  success: CountAmountDto;

  @ApiProperty({ example: { count: 0, amount: 0 }, type: CountAmountDto })
  waiting: CountAmountDto;

  @ApiProperty({ example: { count: 3, amount: 75 }, type: CountAmountDto })
  failed: CountAmountDto;
}
