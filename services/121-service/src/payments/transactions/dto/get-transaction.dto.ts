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

export class PaymentReturnDto {
  @ApiProperty({ example: 2, type: 'number' })
  nrSuccess: number;
  @ApiProperty({ example: 2, type: 'number' })
  nrWaiting: number;
  @ApiProperty({ example: 2, type: 'number' })
  nrError: number;
  @ApiProperty({
    example: { success: 819200, waiting: 0, error: 0 },
    type: 'object',
  })
  totalAmountPerStatus: Record<string, number>;
}
