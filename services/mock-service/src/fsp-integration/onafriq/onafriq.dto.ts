export class OnafriqCallServicePayload {
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
      currencyCode: string; // e.g. "UGX"
    };
    sendFee: {
      amount: number;
      currencyCode: string; // e.g. "UGX"
    };
    sender: {
      msisdn: string; // sender's phone number
      fromCountry: string; // e.g. "GB"
      name: string;
      surname: string;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      email?: string | null;
      dateOfBirth?: string | null; // format YYYY-MM-DD
      placeOfBirth?: string | null; // optional field
      document: {
        idNumber: string; // e.g. "123456789"
        idType: string; // e.g. "ID1" (ID1 = NATIONAL ID)
        idCountry: string; // e.g. "GB"
        idExpiry?: string | null; // format YYYY-MM-DD, optional field
      };
    };
    recipient: {
      msisdn: string; // recipient's phone number
      toCountry: string; // e.g. "DC"
      name: string;
      surname: string;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      email?: string | null;
      dateOfBirth?: string | null;
      document?: string | null; // optional field
      destinationAccount?: {
        accountNumber: string;
      };
    };
    thirdPartyTransId: string; // unique transaction ID
    reference?: string | null; // optional field, can be used for additional info
    purposeOfTransfer: string; // e.g. "PT3"
    sourceOfFunds: string; // e.g. "SF1"
  }[];
}

export class OnafriqCallServiceResponseBodyDto {
  public data: {
    totalTxSent: number;
    noTxAccepted: number;
    noTxRejected: number;
    details: {
      transResponse: {
        thirdPartyId: string;
        status: {
          code: string;
          message: string;
          messageDetail?: string;
        };
      }[];
    };
    timestamp: string; // e.g. "2019-12-18 07:50:26.771"
  };
}
