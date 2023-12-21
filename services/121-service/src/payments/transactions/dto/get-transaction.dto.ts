import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { IntersolveVoucherPayoutStatus } from '../../fsp-integration/intersolve-voucher/enum/intersolve-voucher-payout-status.enum';

export class GetTransactionDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(5, 200)
  public readonly referenceId: string;
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  public readonly payment: number;
  @ApiProperty({ example: 'IntersolvePayoutStatus' })
  @IsOptional()
  @IsString()
  public readonly customDataKey?: string;
  @ApiProperty({ example: IntersolveVoucherPayoutStatus.InitialMessage })
  @IsOptional()
  @IsString()
  public readonly customDataValue?: string;
}

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
  @ApiProperty({ example: 22, type: 'number' })
  public amount: number;
  @ApiProperty({ example: null, type: 'string', required: false })
  public errorMessage: string;
  @ApiProperty()
  public customData: any;
  @ApiProperty({ example: 'Visa debit card', type: 'string' })
  public fspName: string;
  @ApiProperty({ example: 'Intersolve-visa', type: 'string' })
  public fsp: string;
}

export class PaymentReturnDto {
  nrSuccess: number;
  nrWaiting: number;
  nrError: number;
  paymentInProgress: boolean;
}
