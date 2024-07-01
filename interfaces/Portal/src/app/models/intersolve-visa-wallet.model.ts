import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-action.enum';
import { VisaCardMethod } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-method.enum';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';

export interface ParentWallet {
  balance: number;
  lastExternalUpdate: string;
  spentThisMonth: number;
  maxToSpendPerMonth: number;
  lastUsedDate: Date | null;
  cards: PhysicalCard[];
}

export interface PhysicalCard {
  tokenCode: string;
  status: WalletCardStatus121;
  issuedDate: Date;
  links: VisaCardActionLinkDto[];
  explanation: string;
  debugInfo: unknown; // Not used by the frontend
}

interface VisaCardActionLinkDto {
  href: string;
  action: VisaCardAction;
  method: VisaCardMethod;
}
