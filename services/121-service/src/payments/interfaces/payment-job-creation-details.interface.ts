import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export interface PaymentJobCreationDetails {
  registrationId: number;
  registrationMaxPayments: number | null;
  registrationStatus: RegistrationStatusEnum;
  referenceId: string;
  fspName: Fsps;
  programFspConfigurationId: number;
  transactionAmount: number;
  transactionId?: number; // only added after creating the transaction
}
