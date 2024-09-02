import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
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

  @IsNotEmpty()
  @IsString()
  public readonly phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  public readonly nationalId: string;

  @IsNotEmpty()
  @IsNumber()
  public readonly registrationProgramId: number;
}
