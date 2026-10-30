import { ApiProperty } from '@nestjs/swagger';

export class GetSentEmailResponseDto {
  @ApiProperty({ example: 'no-reply@example.org' })
  public readonly sender: string;

  @ApiProperty({ example: ['user@example.org'] })
  public readonly recipients: string[];

  @ApiProperty({ example: 'Your account has been created' })
  public readonly subject: string;

  @ApiProperty({ example: '<p>Hello, welcome to the platform.</p>' })
  public readonly body: string;

  @ApiProperty({ example: '2026-01-01T12:00:00.000Z' })
  public readonly sentAt: string;
}
