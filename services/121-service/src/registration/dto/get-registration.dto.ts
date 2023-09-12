import { LanguageLabelEnum } from '../const/language-mapping.const';
import { RegistrationStatusLabel } from '../const/registration-status-mapping.const';

export class GetRegistrationDto {
  id: number;
  phoneNumber?: string;
  status: RegistrationStatusLabel;
  programId: number;
  referenceId: string;
  preferredLanguage: LanguageLabelEnum;
  inclusionScore: number;
  paymentAmountMultiplier: string;
  note: string;
  noteUpdated: Date;
  financialServiceProvider: string;
  fspDisplayNamePortal: string;
  registrationProgramId: number;
  personAffectedSequence: string;
  maxPayments: number | null;
}
