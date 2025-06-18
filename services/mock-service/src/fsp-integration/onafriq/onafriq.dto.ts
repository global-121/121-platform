// ##TODO: limit to only the fields that are actually used in the request, and remove the rest (once clear). Same for other dto's.
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
      currencyCode: string;
    };
    sendFee: {
      amount: number;
      currencyCode: string;
    };
    sender: {
      msisdn: string; // sender's phone number
      fromCountry: string;
      name: string;
      surname: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      email?: string;
      dateOfBirth?: string;
      placeOfBirth?: string;
      document: {
        idNumber: string;
        idType: string;
        idCountry: string;
        idExpiry?: string;
      };
    };
    recipient: {
      msisdn: string; // recipient's phone number
      toCountry: string;
      name: string;
      surname: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      email?: string;
      dateOfBirth?: string;
      document?: string;
      destinationAccount?: {
        accountNumber: string;
      };
    };
    thirdPartyTransId: string; // unique transaction ID > used as idempotency key
    reference?: string; // optional field, can be used for potential offline reconciliation, but is for now not used.
    purposeOfTransfer: string;
    sourceOfFunds: string;
  }[];
}

export class OnafriqCallServiceResponseBodyDto {
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
}

export class OnafriqCallbackResponseBodyDto {
  thirdPartyTransId: string;
  mfsTransId: string;
  e_trans_id: string;
  fxRate: number;
  status: {
    code: string;
    message: string;
  };
  receiveAmount: {
    amount: number;
    currencyCode: string;
  };
}
