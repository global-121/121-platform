import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';

import { ExportFileFormat } from '@121-service/src/metrics/enum/export-file-format.enum';

export class GetRegistrationEventsQueryDto {
  @IsOptional()
  @IsISO8601()
  public fromDate?: string;

  @IsOptional()
  @IsISO8601()
  public toDate?: string;

  @IsOptional()
  @IsString()
  public referenceId?: string;

  @IsOptional()
  @IsEnum(ExportFileFormat)
  public format?: ExportFileFormat;
}
