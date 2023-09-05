import { WalletStatus121 } from '../../../../../services/121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
export class PhysicalCard {
  tokenCode: string;
  cardNumber?: string;

  balance: number;

  status: WalletStatus121;
  statusLabel?: string;
  explanation?: string;

  issuedDate: string | Date;
  lastUsedDate: string | Date;
}
