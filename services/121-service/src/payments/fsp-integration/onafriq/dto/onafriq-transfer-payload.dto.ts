export class OnafriqTransferPayloadDto {
  public corporateCode: string;
  public password: string;
  public mfsSign: string;
  public batchId: string;
  public requestBody: OnafriqRequestBodyDto[];
  public status?: string;
}

class OnafriqRequestBodyDto {
  public instructionType: InstructionTypeDetails;
  public amount: AmountDetails;
  public sendFee?: SendFeeDetails;
  public sender: SenderDetails;
  public recipient: RecipientDetails;
  public thirdPartyTransId: string;
  public reference: string;
}

class InstructionTypeDetails {
  destAcctType: number;
  amountType: number;
}

class AmountDetails {
  amount: number;
  currencyCode: string;
}

class SendFeeDetails {
  amount?: number;
  currencyCode?: string;
}

class SenderDetails {
  msisdn?: string;
  fromCountry: string;
  name: string;
  surname: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  email?: string;
  dateOfBirth?: Date;
  document?: DocumentDetails;
}

class RecipientDetails {
  msisdn?: string;
  toCountry: string;
  name: string;
  surname: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  email?: string;
  dateOfBirth?: Date;
  document?: DocumentDetails;
  destinationAccount?: DestinationAccountDetails;
}

class DocumentDetails {
  idNumber?: string;
  idType?: string;
  idCountry?: string;
  idExpiry?: Date;
}

class DestinationAccountDetails {
  accountNumber: string;
  mfsBankCode: string;
}
