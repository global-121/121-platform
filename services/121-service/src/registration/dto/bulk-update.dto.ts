import { BulkImportDto } from '@121-service/src/registration/dto/bulk-import.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BulkUpdateDto extends BulkImportDto {
  @ApiProperty()
  @IsString()
  public referenceId: string;

  @ApiProperty()
  @IsOptional()
  public scope?: string;
}
