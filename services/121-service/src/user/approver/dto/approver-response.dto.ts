import { ApiProperty } from '@nestjs/swagger';

// ##TODO: what is actually needed here?
export class ApproverResponseDto {
  @ApiProperty({ example: 1 })
  public id: number;

  @ApiProperty({ example: 2 })
  public assignmentId: number;

  @ApiProperty({ example: 3 })
  public programId: number;

  @ApiProperty({ example: 4 })
  public userId: number;

  @ApiProperty({ example: 'johndoe' })
  public username: string | null;

  @ApiProperty({ example: 5 })
  public order: number;
}
