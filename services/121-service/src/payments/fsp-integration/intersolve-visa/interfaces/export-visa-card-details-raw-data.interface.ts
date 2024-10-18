import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export interface ExportVisaCardDetailsRawData {
  referenceId: string;
  paId: number;
  registrationStatus: RegistrationStatusEnum;
  cardNumber: string;
  issuedDate: Date;
  lastUsedDate: Date;
  balance: number;
  lastExternalUpdate: Date;
  spentThisMonth: number;
  cardStatus: IntersolveVisaCardStatus;
  walletStatus: IntersolveVisaTokenStatus;
  isTokenBlocked: boolean;
}
