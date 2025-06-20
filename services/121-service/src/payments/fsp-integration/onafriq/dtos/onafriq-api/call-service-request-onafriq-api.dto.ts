// NOTE: this is limited to only the fields that are actually used in the request. When expanding to other destination countries other fields may be required.
export class CallServiceRequestOnafriqApiDto {
  public corporateCode: string;
  public password: string;
  public mfsSign: string;
  public batchId: number;
  public requestBody: {
    instructionType: {
      destAcctType: number; // 1 for Mobile Money, 2 for Bank Account
      amountType: number; // 1 for Amount, 2 for Amount and Fee
    };
    amount: {
      amount: number;
      currencyCode: string;
    };
    sender: {
      msisdn: string; // sender's phone number
      fromCountry: string;
      name: string;
      surname: string;
      dateOfBirth: string;
      document: {
        idNumber: string;
        idType: string;
      };
    };
    recipient: {
      msisdn: string; // recipient's phone number
      toCountry: string;
      name: string;
      surname: string;
    };
    thirdPartyTransId: string; // unique transaction ID > used as idempotency key
    purposeOfTransfer: string;
  }[];
}
