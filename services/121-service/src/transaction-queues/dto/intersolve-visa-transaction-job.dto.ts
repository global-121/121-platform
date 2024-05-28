import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
} from 'class-validator';

// TODO: Make properties read-only according to DTO guidelines
export class IntersolveVisaTransactionJobDto {
  @IsNotEmpty()
  @IsNumberString()
  public readonly programId: number;

  @IsNotEmpty()
  @IsNumberString()
  public readonly paymentNumber: number;

  @IsNotEmpty()
  public readonly referenceId: string;

  @IsNotEmpty()
  @IsNumber()
  public readonly transactionAmountInMajorUnit: number; // This is in the major unit of the currency, for example whole euros

  @IsNotEmpty()
  @IsBoolean()
  public readonly isRetry: boolean;

  @IsNotEmpty()
  @IsNumber()
  public readonly userId: number;

  @IsNotEmpty()
  @IsNumber()
  public readonly bulkSize: number;

  @IsOptional()
  public readonly name?: string;

  @IsOptional()
  public readonly addressStreet?: string;

  @IsOptional()
  public readonly addressHouseNumber?: string;

  @IsOptional()
  public readonly addressHouseNumberAddition?: string;

  @IsOptional()
  public readonly addressPostalCode?: string;

  @IsOptional()
  public readonly addressCity?: string;

  @IsOptional()
  public readonly phoneNumber?: string;
}
