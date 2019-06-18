import { ApiModelProperty } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiModelProperty({ example: 'Malawi' })
  readonly country: string;
}
