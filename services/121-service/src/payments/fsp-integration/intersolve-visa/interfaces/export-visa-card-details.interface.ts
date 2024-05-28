import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export interface ExportVisaCardDetails {
  paId: number;
  referenceId: string;
  registrationStatus: RegistrationStatusEnum;
  cardNumber: string;
  cardStatus121: VisaCard121Status;
  issuedDate: Date;
  lastUsedDate: Date;
  balance: number;
  explanation: string;
  spentThisMonth: number;
  isCurrentWallet: boolean;
}
