export class CommercialBankEthiopiaAccountEnquiryDto {
  data: {
    registrationProgramId: number;
    fullNameUsedForTheMatch: string;
    bankAccountNumberUsedForCall: string;
    cbeName: string;
    namesMatch: boolean;
    cbeStatus: string;
    errorMessage: string;
  }[];
  fileName: string;
}
