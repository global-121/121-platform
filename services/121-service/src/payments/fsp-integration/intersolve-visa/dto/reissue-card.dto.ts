import { PersonalData } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/external/personal-data';

export interface ReissueCardDto {
  // Used to find the IntersolveVisaCustomer Entity related to the Registration and continue from there.
  registrationId: number;
  reference: string;
  personalData: PersonalData;
  brandCode: string;
  coverLetterCode: string;
}
