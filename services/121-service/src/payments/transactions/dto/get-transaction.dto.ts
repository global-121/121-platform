import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';
import { StatusEnum } from '../../../shared/enum/status.enum';
import { IntersolvePayoutStatus } from '../../fsp-integration/intersolve/enum/intersolve-payout-status.enum';

export class GetTransactionDto {
  @ApiProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  public readonly payment: number;
  @ApiProperty({ example: 'IntersolvePayoutStatus' })
  @IsString()
  public readonly customDataKey: string;
  @ApiProperty({ example: IntersolvePayoutStatus.InitialMessage })
  @IsString()
  public readonly customDataValue: string;
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
