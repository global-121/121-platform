import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional } from 'class-validator';

export enum ExportType {
  allPeopleAffected = 'all-people-affected',
  included = 'included',
  payment = 'payment',
  selectedForValidation = 'selected-for-validation',
  unusedVouchers = 'unused-vouchers',
  vouchersWithBalance = 'vouchers-with-balance',
  toCancelVouchers = 'to-cancel-vouchers',
  duplicates = 'duplicates',
  cardBalances = 'card-balances',
  paDataChanges = 'pa-data-changes',
}

export class ExportDetailsQueryParamsDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly minPayment: number | null;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly maxPayment: number | null;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  public readonly fromDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  public readonly toDate: Date;
}
