import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import {
  IntersolveVisaCardStatus,
  IntersolveVisaWalletStatus,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export class ExportCardsDto {
  paId: number;
  referenceId: string;
  registrationStatus: RegistrationStatusEnum;
  cardNumber: string;
  cardStatus121: WalletCardStatus121;
  issuedDate: Date;
  lastUsedDate: Date;
  balance: number;
  spentThisMonth: number;
}

export interface ExportWalletData {
  paId: number;
  referenceId: string;
  registrationStatus: RegistrationStatusEnum;
  cardNumber: string;
  issuedDate: Date;
  lastUsedDate: Date;
  balance: number;
  cardStatusIntersolve?: IntersolveVisaWalletStatus;
  tokenBlocked?: boolean;
  walletStatus: IntersolveVisaWalletStatus;
  cardStatus: IntersolveVisaCardStatus;
  explanation: string;
  spentThisMonth: number;
}
