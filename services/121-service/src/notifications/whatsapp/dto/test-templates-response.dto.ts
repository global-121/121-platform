import { ApiProperty } from '@nestjs/swagger';

export class TestTemplatesResponseDto {
  @ApiProperty({
    example: 'abc123',
    description:
      'Session ID to use in GET /notifications/whatsapp/templates/:sessionId to retrieve results',
  })
  public readonly sessionId: string;
}
