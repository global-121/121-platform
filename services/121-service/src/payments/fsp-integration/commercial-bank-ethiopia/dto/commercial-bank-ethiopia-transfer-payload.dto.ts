import { ApiProperty } from '@nestjs/swagger';

export class CommercialBankEthiopiaTransferPayload {
  public debitAmount: number;
  public debitTheIrRef: string;
  public creditTheIrRef: string | null;
  public creditAcctNo: string;
  public creditCurrency: string | null;
  public remitterName: string | null;
  public beneficiaryName: string;
  public status?: string;
}

export class CommercialBankEthiopiaRegistrationData {
  public fieldName: string;
  public value: string;
  public referenceId: string;
}

export class CommercialBankEthiopiaValidationData {
  @ApiProperty()
  public id: number;
  @ApiProperty()
  public fullName: string;
  @ApiProperty()
  public bankAccountNumber: string;
}
