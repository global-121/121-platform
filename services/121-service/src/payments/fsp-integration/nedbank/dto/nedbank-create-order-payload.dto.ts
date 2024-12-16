export interface NedbankCreateOrderPayloadDto {
  Data: {
    Initiation: {
      InstructionIdentification: string;
      InstructedAmount: {
        Amount: string;
        Currency: string;
      };
      DebtorAccount: {
        SchemeName: string;
        Identification: string;
        Name: string;
        SecondaryIdentification: string;
      };
      CreditorAccount: {
        SchemeName: string;
        Identification: string;
        Name: string;
        SecondaryIdentification: string;
      };
    };
    ExpirationDateTime: string;
  };
  Risk: {
    OrderCreateReference: string;
    OrderDateTime: string;
  };
}
