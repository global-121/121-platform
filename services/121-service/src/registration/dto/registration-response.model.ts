import { FinancialServiceProviderName } from '../../financial-service-providers/enum/financial-service-provider-name.enum';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';

export class RegistrationResponse {
  public id: number;
  public referenceId: string;

  public registeredDate: Date | null;
  public validationDate: Date | null;
  public inclusionDate: Date | null;
  public deletedDate: Date | null;
  public declinedDate: Date | null;

  public status: RegistrationStatusEnum;
  public inclusionScore?: number;
  public fsp: FinancialServiceProviderName | string;
  public fspDisplayName: string;
  public hasNote: boolean;

  public paymentAmountMultiplier?: number;
  public phoneNumber?: string;
  public whatsappPhoneNumber?: string;
  public name?: string;
}
