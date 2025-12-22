import { ApiProperty } from '@nestjs/swagger';

export class ApprovalStatusResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: true })
  public readonly approved: boolean;

  @ApiProperty({ example: 'johndoe' })
  public readonly username: string | null;

  @ApiProperty({ example: 5 })
  public readonly order: number;
}
