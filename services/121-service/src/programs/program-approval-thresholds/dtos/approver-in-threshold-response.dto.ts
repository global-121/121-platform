import { ApiProperty } from '@nestjs/swagger';

export class ApproverResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: 4 })
  public readonly userId: number;

  @ApiProperty({ example: 'johndoe' })
  public readonly username: string | null;

  @ApiProperty({ example: 5 })
  public readonly order: number;
}
