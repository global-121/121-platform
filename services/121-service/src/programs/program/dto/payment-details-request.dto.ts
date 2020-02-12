import { ApiModelProperty } from "@nestjs/swagger";

import { IsNumber } from "class-validator";

export class PaymentDetailsRequest {
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly programId: number;
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly installment: number;
}
