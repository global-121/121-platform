import { ApiProperty } from '@nestjs/swagger';
import { Relation } from 'typeorm';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export class TransactionResponseDto {
  @ApiProperty({
    example: '2023-09-28T08:00:10.363Z',
    type: 'string',
    format: 'date-time',
  })
  public created: Date;
  @ApiProperty({
    example: '2023-09-28T08:00:10.363Z',
    type: 'string',
    format: 'date-time',
  })
  public updated: Date;
  @ApiProperty({ example: 1, type: 'number' })
  public payment: number;
  @ApiProperty({ example: TransactionStatusEnum.success, type: 'string' })
  public status: string;
  @ApiProperty({ example: 25, type: 'number' })
  public amount: number;
  @ApiProperty({ example: 'Something went wrong', type: 'string' })
  public errorMessage: string | null;
  @ApiProperty({ example: 'ironBank' })
  public programFinancialServiceProviderConfigurationLabel: Relation<LocalizedString>;
  @ApiProperty({ example: 111, type: 'number' })
  public registrationProgramId: number;
  @ApiProperty({ example: 'Juan Garcia' })
  public name?: string;
}
