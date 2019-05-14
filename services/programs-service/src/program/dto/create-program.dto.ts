import { ApiModelProperty } from "@nestjs/swagger";

export class CreateProgramDto {
  @ApiModelProperty()
  readonly title: string;
  @ApiModelProperty()
  readonly description: string;
  @ApiModelProperty({example: 'Malawi'})
  readonly country: string;
}
