import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateApproverDto {
  @ApiProperty({ example: 5 })
  @IsNumber()
  public order: number;
}
