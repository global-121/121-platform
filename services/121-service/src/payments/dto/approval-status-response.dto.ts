import { ApiProperty } from '@nestjs/swagger';

export class ApprovalStatusResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: true })
  public readonly approved: boolean;

  @ApiProperty({
    example: ['johndoe@email.com', 'janedoe@email.com'],
    type: [String],
  })
  public readonly approvers: string[];

  @ApiProperty({ example: 1 })
  public readonly rank: number;

  @ApiProperty({ example: 'johndoe@email.com', nullable: true })
  public readonly approvedBy: string | null;
}
