import { ApiProperty } from '@nestjs/swagger';

import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/enum/financial-service-provider-integration-type.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
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
  @ApiProperty({ example: 'Visa debit card', type: 'string' })
  public fspName: string;
  @ApiProperty({ example: 'Intersolve-visa', type: 'string' })
  public fsp: string;
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
