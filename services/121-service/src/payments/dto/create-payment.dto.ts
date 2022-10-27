import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { ReferenceIdsDto } from '../../registration/dto/reference-id.dto';

export class CreatePaymentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly payment: number;
  @ApiProperty({ example: 10 })
  @IsNumber()
  public readonly amount: number;
  @ApiProperty()
  @IsOptional()
  public readonly referenceIds: ReferenceIdsDto;
}
