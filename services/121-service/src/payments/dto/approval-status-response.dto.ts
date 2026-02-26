import { ApiProperty } from '@nestjs/swagger';

export class ApprovalStatusResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: true })
  public readonly approved: boolean;

  @ApiProperty({ example: ['johndoe', 'janedoe'], type: [String] })
  public readonly approvers: string[];

  @ApiProperty({ example: 1 })
  public readonly rank: number;
}
