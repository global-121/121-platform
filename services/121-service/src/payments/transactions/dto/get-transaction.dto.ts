import { ApiProperty } from '@nestjs/swagger';
import { IsEmpty, IsNotEmpty, IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { IntersolveVoucherPayoutStatus } from '../../fsp-integration/intersolve-voucher/enum/intersolve-voucher-payout-status.enum';
import { Type } from 'class-transformer';

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
  public readonly paymentDate: Date;
  public readonly payment: number;
  public readonly referenceId: string;
  public readonly status: StatusEnum;
  public readonly amount: number;
  public readonly errorMessage: string;
  public readonly customData: object;
}
