import { ContactInformationDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/external/contact-information.dto';

export interface IntersolveVisaDoTransferOrIssueCardDto {
  // Used to find the IntersolveVisaCustomer Entity related to the Registration and continue from there.
  registrationId: number;
  createCustomerReference: string;
  transferReference: string;
  name: string;
  contactInformation: ContactInformationDto;
  transferAmount: number;
  brandCode: string;
  coverLetterCode: string;
  fundingTokenCode: string;
}
