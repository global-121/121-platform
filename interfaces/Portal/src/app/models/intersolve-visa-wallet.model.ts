import { VisaCardAction } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-action.enum';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';

export interface Wallet {
  tokenCode: string;
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
  actions: VisaCardAction[];
  debugInformation: Record<string, string>; // Not used by the frontend
}
