import { IsNotEmpty, IsNumber } from 'class-validator';

export class IntersolveVisaTransferDto {
  @IsNotEmpty()
  referenceId: string;

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

  @IsNotEmpty()
  @IsNumber()
  transactionAmount: number;

  @IsNotEmpty()
  brandCode: string;

  @IsNotEmpty()
  coverLetterCode: string;
}
