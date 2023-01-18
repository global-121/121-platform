import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class SetRelationsDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly id: number;
}
