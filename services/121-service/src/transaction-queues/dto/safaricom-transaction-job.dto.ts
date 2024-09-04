import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class SafaricomTransactionJobDto {
  @IsNotEmpty()
  @IsNumberString()
  public readonly programId: number;

  @IsNotEmpty()
  @IsNumberString()
  public readonly paymentNumber: number;

  @IsNotEmpty()
  @IsString()
  public readonly referenceId: string;

  @IsNotEmpty()
  @IsNumber()
  public readonly transactionAmount: number;

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
  public readonly phoneNumber?: string;

  @IsOptional()
  public readonly nationalId?: string;

  @IsOptional()
  public readonly registrationProgramId?: number;
}
