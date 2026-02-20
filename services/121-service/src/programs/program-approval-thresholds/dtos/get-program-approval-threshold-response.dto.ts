import { ApiProperty } from '@nestjs/swagger';

export class GetProgramApprovalThresholdResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: 1000 })
  public readonly thresholdAmount: number;

  @ApiProperty({ example: 1 })
  public readonly approvalLevel: number;

  @ApiProperty({ example: 1 })
  public readonly programId: number;

  @ApiProperty()
  public readonly created: Date;

  @ApiProperty()
  public readonly updated: Date;
}
