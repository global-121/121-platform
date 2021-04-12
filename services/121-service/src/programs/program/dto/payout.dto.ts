import { ApiModelProperty } from '@nestjs/swagger';

import { IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class PayoutDto {
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly programId: number;
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly installment: number;
  @ApiModelProperty({ example: 10 })
  @IsNumber()
  public readonly amount: number;
  @ApiModelProperty({ example: 'did:sov:exampleExampleExample' })
  @Length(29, 30)
  @IsString()
  @IsOptional()
  public readonly did: string;
}
