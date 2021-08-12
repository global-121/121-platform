import { fspName } from '../programs/fsp/financial-service-provider.entity';
import { RegistrationStatusEnum } from '../registration/enum/registration-status.enum';
import { PaStatus } from './pa-status.model';

export class RegistrationResponse {
  public id: number;
  public referenceId: string;

  public created: Date | null;
  public importedDate: Date | null;
  public invitedDate: Date | null;
  public noLongerEligibleDate: Date | null;
  public appliedDate: Date | null;
  public selectedForValidationDate: Date | null;
  public validationDate: Date | null;
  public inclusionDate: Date | null;
  public inclusionEndDate: Date | null;
  public rejectionDate: Date | null;

  public status: RegistrationStatusEnum;
  public inclusionScore?: number;
  public fsp: fspName | string;
  public namePartnerOrganization: string;
  public hasNote: boolean;

  public paymentAmountMultiplier?: number;
  public phoneNumber?: string;
  public whatsappPhoneNumber?: string;
  public phonenumberTestResult?: string;
  public name?: string;
  public age?: string;
  public location?: string;
  public vnumber?: string;
}
