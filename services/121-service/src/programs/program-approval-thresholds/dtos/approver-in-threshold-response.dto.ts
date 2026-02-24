import { ApiProperty } from '@nestjs/swagger';

export class ApproverInThresholdResponseDto {
  @ApiProperty({ example: 1 })
  public readonly id: number;

  @ApiProperty({ example: 4 })
  public readonly userId: number;

  @ApiProperty({ example: 'johndoe@example.org' })
  public readonly username: string;

  @ApiProperty({ example: 1 })
  public readonly order: number;
}
