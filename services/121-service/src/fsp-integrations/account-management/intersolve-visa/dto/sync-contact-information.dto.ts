import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class SyncContactInformationDto {
  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  public readonly limit?: number;
}
