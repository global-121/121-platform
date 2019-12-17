import { ApiModelProperty } from "@nestjs/swagger";

import { Length, IsNumber } from "class-validator";

export class PayoutDto {
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly programId: number;
  @ApiModelProperty({ example: 10 })
  @IsNumber()
  public readonly amount: number;

}
