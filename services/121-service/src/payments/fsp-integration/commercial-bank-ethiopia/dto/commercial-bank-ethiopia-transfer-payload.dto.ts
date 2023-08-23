export class CommercialBankEthiopiaTransferPayload {
  public debitAmount: number;
  public debitTheIrRef: string;
  public creditTheIrRef: string;
  public creditAcctNo: string;
  public creditCurrency: string;
  public remitterName: string;
  public beneficiaryName: string;
  public status?: string;
}
