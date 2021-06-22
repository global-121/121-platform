export class InstallmentData {
  id: number;
  installmentDate: Date;
  amount: number;
}

export class Installment extends InstallmentData {
  statusOpen?: boolean;
  isExportAvailable?: boolean;
}

export class PopupPayoutDetails {
  programId: number;
  installment: number;
  amount: number;
  referenceId: string;
  currency: string;
}

export class TotalIncluded {
  public connections: number;
  public transferAmounts: number;
}
