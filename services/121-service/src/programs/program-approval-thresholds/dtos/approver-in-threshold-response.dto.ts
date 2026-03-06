import { ApiProperty } from '@nestjs/swagger';

export class ApproverResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: 4, nullable: true })
  public readonly userId: number | null;

  @ApiProperty({ example: 'johndoe', nullable: true })
  public readonly username: string | null;

  @ApiProperty({ example: 5 })
  public readonly order: number;
}
