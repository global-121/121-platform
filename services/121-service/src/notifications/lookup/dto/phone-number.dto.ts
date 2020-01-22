import { ApiModelProperty } from "@nestjs/swagger";

import { Length } from "class-validator";

export class PhoneNumberDto {
  @ApiModelProperty({ example: '+000000000000' })
  @Length(8, 17)
  public readonly phoneNumber: string;
}
