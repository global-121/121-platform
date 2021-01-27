export class InstallmentData {
  id: number;
  amount: number;
  installmentDate: Date;
}

export class Installment extends InstallmentData {
  firstOpen?: boolean;
  statusOpen?: boolean;
  isExportAvailable?: boolean;
  isInProgress?: boolean;
}

export class PopupPayoutDetails {
  programId: number;
  installment: number;
  amount: number;
  did: string;
  currency: string;
}
