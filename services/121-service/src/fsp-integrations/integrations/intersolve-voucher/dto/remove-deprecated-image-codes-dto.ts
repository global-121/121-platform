import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class RemoveDeprecatedImageCodesDto {
  @ApiPropertyOptional({
    description: `
    **TESTING ONLY**: Allows overriding the current system date for testing purposes.
    When provided in DEBUG mode, the system will use this date instead of the actual current date
    to determine which image codes are deprecated (older than 24 hours from this mock date).
    Has no effect in production environments.
  `,
    example: '2021-02-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  mockCurrentDate?: string;
}
