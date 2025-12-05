import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';

export interface DoTransferOrIssueCardParams {
  // Used to find the IntersolveVisaCustomer Entity related to the Registration and continue from there.
  readonly registrationId: number;
  readonly createCustomerReference: string;
  readonly transferReference: string;
  readonly name: string;
  readonly contactInformation: ContactInformation;
  readonly transferValueInMajorUnit: number;
  readonly brandCode: string;
  readonly coverLetterCode: string;
  readonly fundingTokenCode: string;
}
