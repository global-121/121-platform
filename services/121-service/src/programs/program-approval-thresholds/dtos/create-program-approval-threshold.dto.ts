import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateProgramApprovalThresholdDto {
  @ApiProperty({ example: 1000, description: 'Threshold amount for approval' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  public readonly thresholdAmount: number;

  @ApiProperty({
    type: [Number],
    required: false,
    description: 'User IDs for approvers of this threshold',
  })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  public readonly userIds: number[];
}
