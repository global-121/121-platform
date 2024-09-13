import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

import { ReferenceIdsDto } from '@121-service/src/registration/dto/reference-id.dto';

export class RetryPaymentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly payment: number;
  @ApiProperty()
  @IsOptional()
  public readonly referenceIds?: ReferenceIdsDto;
}
