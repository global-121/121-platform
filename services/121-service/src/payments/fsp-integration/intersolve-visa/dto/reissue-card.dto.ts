import { IsNotEmpty } from 'class-validator';

export class ReissueCardDto {
  // Used to find the IntersolveVisaCustomer Entity related to the Registration and continue from there.
  @IsNotEmpty()
  registrationId: number;

  // Only used to send as CorrelationId to Intersolve. Not used internally, since the IntersolveVisa Module does not "know about" Registrations.
  @IsNotEmpty()
  referenceId: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  addressStreet: string;

  @IsNotEmpty()
  addressHouseNumber: string;

  @IsNotEmpty()
  addressHouseNumberAddition: string;

  @IsNotEmpty()
  addressPostalCode: string;

  @IsNotEmpty()
  addressCity: string;

  @IsNotEmpty()
  phoneNumber: string;

  @IsNotEmpty()
  brandCode: string;

  @IsNotEmpty()
  coverLetterCode: string;
}
