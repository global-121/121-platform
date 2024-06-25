import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-wallet-status.enum';
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
