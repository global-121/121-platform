import { ApiModelProperty } from "@nestjs/swagger";

export class BindCriteriumCountryDto {
    @ApiModelProperty({example: 1})
    readonly countryId: number;
    @ApiModelProperty({example: 1})
    readonly criteriumId: number;
  }
  