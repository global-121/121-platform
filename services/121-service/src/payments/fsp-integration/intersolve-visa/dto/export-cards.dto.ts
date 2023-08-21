import { RegistrationStatusEnum } from '../../../../registration/enum/registration-status.enum';
import { WalletStatus121 } from '../enum/wallet-status-121.enum';
import { IntersolveVisaWalletStatus } from '../intersolve-visa-wallet.entity';

export class ExportCardsDto {
  paId: number;
  referenceId: string;
  registrationStatus: RegistrationStatusEnum;
  cardNumber: number;
  cardStatus121: WalletStatus121;
  issuedDate: Date;
  lastUsedDate: Date;
  balance: number;
  cardStatusIntersolve?: IntersolveVisaWalletStatus;
  tokenBlocked?: boolean;
  isCurrentWallet?: boolean;
}
