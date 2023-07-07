export class PhysicalCard {
  tokenCode: string;
  cardNumber?: string;

  balance: number;

  status: PhysicalCardStatus;
  statusLabel?: string;

  issuedDate: string | Date;
  lastUsedDate: string | Date;
}

export enum PhysicalCardStatus {
  active = 'ACTIVE',
  blocked = 'BLOCKED',
}
