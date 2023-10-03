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

export class CommercialBankEthiopiaRegistrationData {
  public fieldName: string;
  public value: string;
  public referenceId: string;
}

export class CommercialBankEthiopiaValidationData {
  public id: number;
  public fullName: string;
  public bankAccountNumber: string;
  public status: string;
  public cbeName: string;
  public discrepancyNname: string;
  public cbeStatus: string;
  public errorMessage: string;
}
