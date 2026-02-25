import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';

import { CreateApproverForThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-approver-for-threshold.dto';

export class CreateProgramApprovalThresholdDto {
  @ApiProperty({ example: 1000, description: 'Threshold amount for approval' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  public readonly thresholdAmount: number;

  @ApiProperty({ example: 1, description: 'Approval level' })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  public readonly approvalLevel: number;

  @ApiProperty({
    type: [CreateApproverForThresholdDto],
    required: false,
    description: 'List of approvers for this threshold',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateApproverForThresholdDto)
  public readonly approvers?: CreateApproverForThresholdDto[];
}
