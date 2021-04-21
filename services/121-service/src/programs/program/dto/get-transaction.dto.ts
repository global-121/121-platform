import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsNotEmpty, IsString, IsNumber } from 'class-validator';

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
  public readonly installment: string;
  @ApiModelProperty({ example: 'IntersolvePayoutStatus' })
  @IsString()
  public readonly customDataKey: string;
  @ApiModelProperty({ example: 'InitialMessage' })
  @IsString()
  public readonly customDataValue: string;
}
