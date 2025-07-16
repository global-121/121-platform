// NOTE: this is limited to only the fields that are actually used in the request. When expanding to other destination countries other fields may be required.
export interface OnafriqApiCallServiceRequestBody {
  corporateCode: string | undefined;
  password: string | undefined;
  mfsSign: string;
  batchId: string;
  requestBody: {
    instructionType: {
      destAcctType: number; // 1 for Mobile Money, 2 for Bank Account
      amountType: number; // 1 for Amount, 2 for Amount and Fee
    };
    amount: {
      amount: number;
      currencyCode: string | undefined;
    };
    sender: {
      msisdn: string | undefined; // sender's phone number
      fromCountry: string | undefined;
      name: string | undefined;
      surname: string | undefined;
      dateOfBirth: string | undefined;
      document: {
        idNumber: string | undefined;
        idType: string | undefined;
      };
    };
    recipient: {
      msisdn: string; // recipient's phone number
      toCountry: string | undefined;
      name: string;
      surname: string;
    };
    thirdPartyTransId: string; // unique transaction ID > used as idempotency key
    purposeOfTransfer: string;
  }[];
}
