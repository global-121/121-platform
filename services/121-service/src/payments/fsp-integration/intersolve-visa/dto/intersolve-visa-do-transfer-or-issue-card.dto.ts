import { ContactInformationDto } from './external/contact-information.dto';

export interface IntersolveVisaDoTransferOrIssueCardDto {
  // Used to find the IntersolveVisaCustomer Entity related to the Registration and continue from there.
  registrationId: number;
  reference: string;
  // TODO: REFACTOR: Use PersonalData from external/personal-data.ts
  name: string;
  contactInformation: ContactInformationDto;
  transferAmount: number;
  brandCode: string;
  coverLetterCode: string;
  fundingTokenCode: string;
}
