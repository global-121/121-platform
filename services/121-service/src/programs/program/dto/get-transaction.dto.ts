import { ApiModelProperty } from '@nestjs/swagger';
import { Length, IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class GetTransactionDto {
  @ApiModelProperty({ example: 'did:sov:exampleExampleExample' })
  @Length(29, 30)
  public readonly did: string;
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
