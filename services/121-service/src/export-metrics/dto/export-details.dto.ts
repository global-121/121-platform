import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export enum ExportType {
  allPeopleAffected = 'all-people-affected',
  included = 'included',
  payment = 'payment',
  unusedVouchers = 'unused-vouchers',
  vouchersWithBalance = 'vouchers-with-balance',
  toCancelVouchers = 'to-cancel-vouchers',
  duplicates = 'duplicates',
  exportTableView = 'export-table-view',
}

export class ExportDetailsDto {
  @ApiProperty({
    enum: ExportType,
    example: Object.values(ExportType).join(' | '),
  })
  @IsEnum(ExportType)
  public readonly type: ExportType;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  public readonly minPayment: number | null;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  public readonly maxPayment: number | null;
}
