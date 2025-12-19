import { ApiProperty } from '@nestjs/swagger';

// ##TODO: not everything here might actually be needed (programId/assignmentId)?
export class ApproverResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: 2 })
  public readonly assignmentId: number;

  @ApiProperty({ example: 3 })
  public readonly programId: number;

  @ApiProperty({ example: 4 })
  public readonly userId: number;

  @ApiProperty({ example: 'johndoe' })
  public readonly username: string | null;

  @ApiProperty({ example: 5 })
  public readonly order: number;
}
