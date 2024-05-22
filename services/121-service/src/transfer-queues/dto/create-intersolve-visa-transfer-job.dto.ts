import { IsNotEmpty, IsNumber, IsNumberString } from 'class-validator';

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

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  street: string;

  @IsNotEmpty()
  houseNumber: string;

  @IsNotEmpty()
  houseNumberAddition: string;

  @IsNotEmpty()
  postalCode: string;

  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  phoneNumber: string;
}
