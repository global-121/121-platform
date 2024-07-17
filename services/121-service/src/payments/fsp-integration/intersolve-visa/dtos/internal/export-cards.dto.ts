import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export class ExportCardsDto {
  paId: number;
  referenceId: string;
  registrationStatus: RegistrationStatusEnum;
  cardNumber: string;
  cardStatus121: VisaCard121Status;
  issuedDate: Date;
  lastUsedDate: Date;
  balance: number;
  spentThisMonth: number;
  explanation?: string;
  isCurrentWallet?: boolean;
}

export interface ExportWalletData {
  paId: number;
  referenceId: string;
  registrationStatus: RegistrationStatusEnum;
  cardNumber: string;
  issuedDate: Date;
  lastUsedDate: Date;
  balance: number;
  cardStatusIntersolve?: IntersolveVisaTokenStatus;
  tokenBlocked?: boolean;
  walletStatus: IntersolveVisaTokenStatus;
  cardStatus: IntersolveVisaCardStatus;
  explanation: string;
  spentThisMonth: number;
}
