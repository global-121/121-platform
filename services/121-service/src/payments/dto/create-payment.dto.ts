import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, ValidateNested } from 'class-validator';
import { ReferenceIdsMin1Dto } from './../../registration/dto/referenc-id-min-1.dto';

export class CreatePaymentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly payment: number;
  @ApiProperty({ example: 10 })
  @IsNumber()
  public readonly amount: number;
  @ApiProperty()
  @ValidateNested()
  @Type(() => ReferenceIdsMin1Dto)
  public readonly referenceIds: ReferenceIdsMin1Dto;
}
