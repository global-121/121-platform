import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { CreateProgramApprovalThresholdDto } from '@121-service/src/programs/program-approval-thresholds/dtos/create-program-approval-threshold.dto';

export class BulkCreateProgramApprovalThresholdsDto {
  @ApiProperty({
    type: [CreateProgramApprovalThresholdDto],
    description: 'Array of thresholds to create',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProgramApprovalThresholdDto)
  public readonly thresholds: CreateProgramApprovalThresholdDto[];
}
