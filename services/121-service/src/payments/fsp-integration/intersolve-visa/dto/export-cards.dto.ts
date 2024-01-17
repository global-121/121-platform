import { RegistrationStatusEnum } from '../../../../registration/enum/registration-status.enum';
import { WalletCardStatus121 } from '../enum/wallet-status-121.enum';
import {
  IntersolveVisaCardStatus,
  IntersolveVisaWalletStatus,
} from '../intersolve-visa-wallet.entity';

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
