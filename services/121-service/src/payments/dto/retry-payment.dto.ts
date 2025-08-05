import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

import { ReferenceIdsDto } from '@121-service/src/registration/dto/reference-ids.dto';

export class RetryPaymentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly paymentId: number;
  @ApiProperty()
  @IsOptional()
  public readonly referenceIds?: ReferenceIdsDto;
}
