import { ApiProperty } from '@nestjs/swagger';

import { ApproverResponseDto } from '@121-service/src/programs/program-approval-thresholds/dtos/approver-in-threshold-response.dto';

export class GetProgramApprovalThresholdResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: 1000 })
  public readonly thresholdAmount: number;

  @ApiProperty({ example: 1 })
  public readonly programId: number;

  @ApiProperty({ type: [ApproverResponseDto] })
  public readonly approvers: ApproverResponseDto[];
}
