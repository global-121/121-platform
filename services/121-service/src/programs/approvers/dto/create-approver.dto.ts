import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateApproverDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly userId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  public readonly programApprovalThresholdId: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  public readonly order: number;
}
