import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MtnTransferStatusResponseDto {
  @ApiProperty({ example: 'SUCCESSFUL' })
  public readonly status: string;

  @ApiPropertyOptional({ example: 'Completed' })
  public readonly reason?: string;
}
