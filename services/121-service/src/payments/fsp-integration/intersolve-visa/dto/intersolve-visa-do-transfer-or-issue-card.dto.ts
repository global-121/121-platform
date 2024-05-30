import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class IntersolveVisaDoTransferOrIssueCardDto {
  // Used to find the IntersolveVisaCustomer Entity related to the Registration and continue from there.
  @IsNotEmpty()
  registrationId: number;

  // Only used to send as a reference to Intersolve. Not used internally, since the IntersolveVisa Module does not "know about" Registrations.
  @IsNotEmpty()
  reference: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  addressStreet: string;

  @IsNotEmpty()
  addressHouseNumber: string;

  @IsOptional()
  addressHouseNumberAddition?: string;

  @IsNotEmpty()
  addressPostalCode: string;

  @IsNotEmpty()
  addressCity: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsNotEmpty()
  @IsNumber()
  transferAmount: number;

  @IsNotEmpty()
  brandCode: string;

  @IsNotEmpty()
  coverLetterCode: string;

  @IsNotEmpty()
  fundingTokenCode: string;
}
