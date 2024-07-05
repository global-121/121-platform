import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-action.enum';
import { VisaCardMethod } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-method.enum';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';

export interface Wallet {
  balance: number;
  spentThisMonth: number;
  maxToSpendPerMonth: number;
  lastUsedDate: Date | null;
  lastExternalUpdate: string;
  cards: Card[];
}

export interface Card {
  tokenCode: string;
  status: VisaCard121Status;
  explanation: string;
  issuedDate: Date;
  links: VisaCardActionLinkDto[];
  debugInfo: unknown; // Not used by the frontend
}

interface VisaCardActionLinkDto {
  href: string;
  action: VisaCardAction;
  method: VisaCardMethod;
}
