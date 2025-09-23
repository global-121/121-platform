import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export interface PaymentJobCreationDetailsBase {
  referenceId: string;
  fspName: Fsps;
  transactionAmount: number;
  transactionId?: number; // only added after creating the transaction
}
export interface PaymentJobCreationDetails
  extends PaymentJobCreationDetailsBase {
  registrationId: number;
  registrationMaxPayments: number | null;
  registrationStatus: RegistrationStatusEnum;
  programFspConfigurationId: number;
}
