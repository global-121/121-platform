import { ApiProperty } from '@nestjs/swagger';

import { ApproverInThresholdResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/approver-in-threshold-response.dto';

export class GetProgramApprovalThresholdResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: 1000 })
  public readonly thresholdAmount: number;

  @ApiProperty({ example: 1 })
  public readonly programId: number;

  @ApiProperty()
  public readonly created: Date;

  @ApiProperty()
  public readonly updated: Date;

  @ApiProperty({ type: [ApproverInThresholdResponseDto] })
  public readonly approvers: ApproverInThresholdResponseDto[];
}
