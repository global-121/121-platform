import {
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class CreateIntersolveVisaTransferJobDto {
  @IsNotEmpty()
  @IsNumberString()
  programId: number;

  @IsNotEmpty()
  @IsNumberString()
  paymentNumber: number;

  @IsNotEmpty()
  referenceId: string;

  @IsNotEmpty()
  @IsNumber()
  transactionAmount: number;

  @IsNotEmpty()
  @IsNumber()
  bulkSize: number;

  @IsOptional()
  name?: string;

  @IsOptional()
  addressStreet?: string;

  @IsOptional()
  addressHouseNumber?: string;

  @IsOptional()
  addressHouseNumberAddition?: string;

  @IsOptional()
  addressPostalCode?: string;

  @IsOptional()
  addressCity?: string;

  @IsOptional()
  phoneNumber?: string;
}
