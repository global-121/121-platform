import { IsNotEmpty, IsNumber } from 'class-validator';

export class ReissueCardDto {
  // Used to find the IntersolveVisaCustomer Entity related to the Registration and continue from there.
  @IsNotEmpty()
  registrationId: string;

  // Only used to send as CorrelationId to Intersolve. Not used internally, since the IntersolveVisa Module does not "know about" Registrations.
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
  brandCode: string;

  @IsNotEmpty()
  coverLetterCode: string;
}
