import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';

export class PhysicalCard {
  tokenCode: string;
  cardNumber?: string;

  balance: number;

  status: WalletCardStatus121;
  statusLabel?: string;
  explanation?: string;
  spentThisMonth: number;
  maxToSpendPerMonth: number;

  issuedDate: string | Date;
  lastUsedDate: string | Date;

  links: {
    action: string;
    href: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  }[];
}
