export class CommercialBankEthiopiaTransferPayload {
  public debitAmount: number;
  public debitTheirRef: string;
  public creditTheirRef: string | null;
  public creditAcctNo: string;
  public creditCurrency: string | null;
  public remitterName: string | null;
  public beneficiaryName: string;
  public status?: string;
}
