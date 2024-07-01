import { ContactInformationDto } from './external/contact-information.dto';

export interface ReissueCardDto {
  // Used to find the IntersolveVisaCustomer Entity related to the Registration and continue from there.
  registrationId: number;
  reference: string;
  name: string;
  contactInformation: ContactInformationDto;
  brandCode: string;
  coverLetterCode: string;
}
