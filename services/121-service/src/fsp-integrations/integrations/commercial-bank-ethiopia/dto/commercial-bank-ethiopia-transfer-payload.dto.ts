import { ApiProperty } from '@nestjs/swagger';

export class CreditTransferApiParams {
  public debitAmount: number;
  public debitTheirRef: string;
  public creditTheirRef: string | null;
  public creditAcctNo: string;
  public creditCurrency: string | null;
  public remitterName: string | null;
  public beneficiaryName: string;
  public status?: string;
}

export class CommercialBankEthiopiaValidationData {
  @ApiProperty()
  public id: number;
  @ApiProperty()
  public fullName: string;
  @ApiProperty()
  public bankAccountNumber: string;
}
