import { ApiModelProperty } from '@nestjs/swagger';

import { IsNumber, IsOptional } from 'class-validator';
import { ReferenceIdsDto } from '../../registration/dto/reference-id.dto';

export class CreatePaymentDto {
  @ApiModelProperty({ example: 1 })
  @IsNumber()
  public readonly payment: number;
  @ApiModelProperty({ example: 10 })
  @IsNumber()
  public readonly amount: number;
  @ApiModelProperty()
  @IsOptional()
  public readonly referenceIds: ReferenceIdsDto;
}
