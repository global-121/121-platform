import { ApiProperty } from '@nestjs/swagger';

export class CreateMachineUserResponseDto {
  @ApiProperty({ example: 42 })
  public readonly id: number;

  @ApiProperty({ example: 'espo-connector' })
  public readonly username: string;

  @ApiProperty({
    example: 'Xk3v9Qm2...',
    description:
      'The API key. It is only shown once and cannot be retrieved later. If it is lost, delete the user and create it again.',
  })
  public readonly apiKey: string;
}
