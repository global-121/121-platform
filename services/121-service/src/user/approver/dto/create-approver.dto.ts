import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateApproverDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  public userId: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  public order: number;
}
