import { ApiModelProperty } from "@nestjs/swagger";

export class CreateCriteriumDto {
    @ApiModelProperty({example: "test"})
    readonly criterium: string;
    @ApiModelProperty({example: 'numeric / dropdown'})
    readonly answerType: string;
    @ApiModelProperty({example: 'standard / custom'})
    readonly criteriumType: string;
  }
  