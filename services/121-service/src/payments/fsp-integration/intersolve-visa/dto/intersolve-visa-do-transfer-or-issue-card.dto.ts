export interface IntersolveVisaDoTransferOrIssueCardDto {
  // Used to find the IntersolveVisaCustomer Entity related to the Registration and continue from there.
  registrationId: number;
  // Only used to send as a reference to Intersolve. Not used internally, since the IntersolveVisa Module does not "know about" Registrations.
  reference: string;
  name: string;
  addressStreet: string;
  addressHouseNumber: string;
  addressHouseNumberAddition?: string;
  addressPostalCode: string;
  addressCity: string;
  phoneNumber: string;
  transferAmount: number;
  brandCode: string;
  coverLetterCode: string;
  fundingTokenCode: string;
}
