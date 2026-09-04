import { ApiProperty } from '@nestjs/swagger';

export class AlfouadTransactionResponseDto {
  @ApiProperty({ example: '1' })
  public readonly State: string;

  @ApiProperty({ example: 'Transaction created successfully' })
  public readonly Message: string;

  @ApiProperty({ example: '822', required: false, nullable: true })
  public readonly ErrorCode?: string | null;
}
