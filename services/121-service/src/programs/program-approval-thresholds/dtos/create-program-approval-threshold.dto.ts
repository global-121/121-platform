import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Max,
  Min,
} from 'class-validator';

export class CreateProgramApprovalThresholdDto {
  @ApiProperty({ example: 1000, description: 'Threshold amount for approval' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100_000_000_000) // Sanity upper bound to reject clearly erroneous input
  @IsNotEmpty()
  public readonly thresholdAmount: number;

  @ApiProperty({
    type: [Number],
    description:
      'User IDs for approvers of this threshold. Must contain at least one user ID.',
    example: [1, 2],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  public readonly userIds: number[];
}
