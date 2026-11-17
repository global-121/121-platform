import { ApiProperty } from '@nestjs/swagger';

export class MachineUserApiKeyResponseDto {
  @ApiProperty({
    example: 'Xk3v9Qm2...',
    description:
      'The new API key. It is only shown once and cannot be retrieved later. The previous API key no longer works.',
  })
  public readonly apiKey: string;
}
