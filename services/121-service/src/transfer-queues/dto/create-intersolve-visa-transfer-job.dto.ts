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
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  // TODO: What is the value of prefixing with "address" (see Clean Code)? If better not, then refactor elsehwere.
  @IsNotEmpty()
  Street: string;

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
