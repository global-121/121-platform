import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export enum ExportType {
  allPeopleAffected = 'all-people-affected',
  included = 'included',
  payment = 'payment',
  unusedVouchers = 'unused-vouchers',
  vouchersWithBalance = 'vouchers-with-balance',
  toCancelVouchers = 'to-cancel-vouchers',
  duplicates = 'duplicates',
  intersolveVisaCardDetails = 'intersolve-visa-card-details',
}

export class ExportDetailsQueryParamsDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly minPayment?: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly maxPayment?: number;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  public readonly fromDate?: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  public readonly toDate?: Date;

  @IsString() // Validate that 'search' is a string
  @IsOptional()
  public readonly search?: string; // Add 'search' parameter
}
