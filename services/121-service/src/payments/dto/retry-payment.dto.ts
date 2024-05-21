import { ReferenceIdsDto } from '@121-service/src/registration/dto/reference-id.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class RetryPaymentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly payment: number;
  @ApiProperty()
  @IsOptional()
  public readonly referenceIds?: ReferenceIdsDto;
}
