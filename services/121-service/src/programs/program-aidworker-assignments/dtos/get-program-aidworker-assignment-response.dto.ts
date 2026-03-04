import { ApiProperty } from '@nestjs/swagger';

export class GetProgramAidworkerAssignmentResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: 2 })
  public readonly userId: number;

  @ApiProperty({ example: 1 })
  public readonly programId: number;

  @ApiProperty({ example: '' })
  public readonly scope: string;

  @ApiProperty({ example: null, nullable: true })
  public readonly programApprovalThresholdId: number | null;
}
