import { ApiProperty } from '@nestjs/swagger';
import { Relation } from 'typeorm';

import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/enum/financial-service-provider-integration-type.enum';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { UserOwnerDto } from '@121-service/src/user/dto/user-owner.dto';

export class TransactionReturnDto {
  @ApiProperty({
    example: '2023-09-28T08:00:10.363Z',
    type: 'string',
    format: 'date-time',
  })
  public paymentDate: Date;
  @ApiProperty({ example: 2, type: 'number' })
  public payment: number;
  @ApiProperty({ example: '2982g82bdsf89sdsd', type: 'string' })
  public referenceId: string;
  @ApiProperty({ example: TransactionStatusEnum.success, type: 'string' })
  public status: string;
  @ApiProperty({ example: 25, type: 'number' })
  public amount: number;
  @ApiProperty({ example: null, type: 'string', required: false })
  public errorMessage: string;
  @ApiProperty()
  public customData: any;
  // FinancialServiceProviderName is used in the frontend to determine whether a transaction has a voucher
  @ApiProperty({ example: FinancialServiceProviders.excel })
  public financialServiceProviderName: Relation<FinancialServiceProviders>;
  @ApiProperty({ example: 'ironBank' })
  public programFinancialServiceProviderConfigurationLabel: Relation<LocalizedString>;
  @ApiProperty({ example: { en: 'Iron bank' }, type: 'string' })
  public programFinancialServiceProviderConfigurationName: string;
  @ApiProperty({
    example: FinancialServiceProviderIntegrationType.api,
    type: 'string',
  })
  public fspIntegrationType: string;
}

export class AuditedTransactionReturnDto extends TransactionReturnDto {
  @ApiProperty({ type: () => UserOwnerDto })
  public user: UserOwnerDto;
}

export class PaymentReturnDto {
  @ApiProperty({ example: { count: 0, amount: 0 }, type: 'object' })
  success: { count: number; amount: number };

  @ApiProperty({ example: { count: 0, amount: 0 }, type: 'object' })
  waiting: { count: number; amount: number };

  @ApiProperty({ example: { count: 3, amount: 75 }, type: 'object' })
  failed: { count: number; amount: number };
}
