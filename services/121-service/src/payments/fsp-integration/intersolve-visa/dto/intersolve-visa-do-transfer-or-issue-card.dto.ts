export interface IntersolveVisaDoTransferOrIssueCardDto {
  // Used to find the IntersolveVisaCustomer Entity related to the Registration and continue from there.
  registrationId: number;
  reference: string;
  // TODO: REFACTOR: Use PersonalData from external/personal-data.ts
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
