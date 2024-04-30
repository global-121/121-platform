import { ApiProperty } from '@nestjs/swagger';
import { FinancialServiceProviderIntegrationType } from '../../../financial-service-provider/enum/financial-service-provider-integration-type.enum';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { UserOwnerDto } from '../../../user/dto/user-owner.dto';

export class GetTransactionOutputDto {
  @ApiProperty({ example: new Date() })
  public readonly paymentDate: Date;
  @ApiProperty({ example: 1 })
  public readonly payment: number;
  @ApiProperty({ example: 'referenceId' })
  public readonly referenceId: string;
  @ApiProperty({ example: StatusEnum.success })
  public readonly status: StatusEnum;
  @ApiProperty({ example: 10 })
  public readonly amount: number;
  @ApiProperty({ example: 'errorMessage' })
  public readonly errorMessage: string;
  @ApiProperty({ example: {} })
  public readonly customData: object;
}

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
  @ApiProperty({ example: StatusEnum.success, type: 'string' })
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
}
