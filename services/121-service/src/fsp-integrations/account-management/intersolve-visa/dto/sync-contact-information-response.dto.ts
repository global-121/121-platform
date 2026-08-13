import { ApiProperty } from '@nestjs/swagger';

export class SyncContactInformationResponseDto {
  @ApiProperty({ example: 100 })
  public readonly syncedCustomers: number;
}
