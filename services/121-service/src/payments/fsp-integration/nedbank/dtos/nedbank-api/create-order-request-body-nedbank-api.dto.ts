export interface CreateOrderRequestBodyNedbankApiDto {
  Data: {
    Initiation: {
      InstructionIdentification: string;
      InstructedAmount: {
        Amount: string; // This should be a string with two decimal places
        Currency: 'ZAR'; // This should always be 'ZAR'
      };
      DebtorAccount: {
        SchemeName: 'account'; // should always be 'account'
        Identification: string | undefined;
        Name: string;
      };
      CreditorAccount: {
        SchemeName: string;
        Identification: string;
        Name: string;
      };
    };
    ExpirationDateTime: string;
  };
  Risk: {
    OrderCreateReference: string;
    OrderDateTime: string;
  };
}
