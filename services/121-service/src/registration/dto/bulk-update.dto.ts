import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { BulkImportDto } from '@121-service/src/registration/dto/bulk-import.dto';

export class BulkUpdateDto extends BulkImportDto {
  @ApiProperty()
  @IsString()
  public referenceId: string;

  @ApiProperty()
  @IsOptional()
  declare public scope?: string;
}
