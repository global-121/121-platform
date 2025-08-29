import { IsEnum, IsISO8601, IsNumberString, IsOptional } from 'class-validator';

import { ExportFileFormat } from '@121-service/src/metrics/enum/export-file-format.enum';

export class GetTransactionsQueryDto {
  @IsOptional()
  @IsISO8601()
  public fromDate?: string;
  @IsOptional()
  @IsISO8601()
  public toDate?: string;
  @IsOptional()
  @IsEnum(ExportFileFormat)
  public format?: ExportFileFormat;
  @IsOptional()
  @IsNumberString()
  public paymentId?: string;
}
