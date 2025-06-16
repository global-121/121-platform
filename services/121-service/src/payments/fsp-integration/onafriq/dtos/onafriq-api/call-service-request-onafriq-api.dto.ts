export interface CallServiceRequestOnafriqApiDto {
  readonly corporateCode: string;
  readonly password: string;
  readonly mfsSign: string;
  readonly batchId: number;
  readonly requestBody: {
    readonly instructionType: {
      readonly destAcctType: number; // 1 for Mobile Money, 2 for Bank Account
      readonly amountType: number; // 1 for Amount, 2 for Amount and Fee
    };
    readonly amount: {
      readonly amount: number;
      readonly currencyCode: string; // e.g. "UGX"
    };
    readonly sendFee: {
      readonly amount: number;
      readonly currencyCode: string; // e.g. "UGX"
    };
    readonly sender: {
      readonly msisdn: string; // sender's phone number
      readonly fromCountry: string; // e.g. "GB"
      readonly name: string;
      readonly surname: string;
      readonly address?: string | null;
      readonly city?: string | null;
      readonly state?: string | null;
      readonly postalCode?: string | null;
      readonly email?: string | null;
      readonly dateOfBirth?: string | null; // format YYYY-MM-DD
      readonly placeOfBirth?: string | null; // optional field
      readonly document: {
        idNumber: string; // e.g. "123456789"
        idType: string; // e.g. "ID1" (ID1 = NATIONAL ID)
        idCountry: string; // e.g. "GB"
        idExpiry?: string | null; // format YYYY-MM-DD, optional field
      };
    };
    readonly recipient: {
      readonly msisdn: string; // recipient's phone number
      readonly toCountry: string; // e.g. "DC"
      readonly name: string;
      readonly surname: string;
      readonly address?: string | null;
      readonly city?: string | null;
      readonly state?: string | null;
      readonly postalCode?: string | null;
      readonly email?: string | null;
      readonly dateOfBirth?: string | null;
      readonly document?: string | null; // optional field
      readonly destinationAccount?: {
        accountNumber: string;
      };
    };
    readonly thirdPartyTransId: string; // unique transaction ID
    readonly reference?: string | null; // optional field, can be used for additional info
    readonly purposeOfTransfer: string; // e.g. "PT3"
    readonly sourceOfFunds: string; // e.g. "SF1"
  }[];
}
