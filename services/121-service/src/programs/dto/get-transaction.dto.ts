import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { StatusEnum } from '../../shared/enum/status.enum';

export class GetTransactionDto {
  @ApiModelProperty({ example: '910c50be-f131-4b53-b06b-6506a40a2734' })
  @Length(29, 36)
  public readonly referenceId: string;
  @ApiModelProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  public readonly programId: number;
  @ApiModelProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  public readonly installment: number;
  @ApiModelProperty({ example: 'IntersolvePayoutStatus' })
  @IsString()
  public readonly customDataKey: string;
  @ApiModelProperty({ example: 'InitialMessage' })
  @IsString()
  public readonly customDataValue: string;
}

export class GetTransactionOutputDto {
  public readonly installmentDate: Date;
  public readonly installment: number;
  public readonly referenceId: string;
  public readonly status: StatusEnum;
  public readonly amount: number;
  public readonly error: string;
  public readonly customData: object;
}
