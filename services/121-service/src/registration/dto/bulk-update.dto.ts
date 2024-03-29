import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BulkImportDto } from './bulk-import.dto';

export class BulkUpdateDto extends BulkImportDto {
  @ApiProperty()
  @IsString()
  public referenceId: string;

  @ApiProperty()
  @IsOptional()
  public scope: string;
}
