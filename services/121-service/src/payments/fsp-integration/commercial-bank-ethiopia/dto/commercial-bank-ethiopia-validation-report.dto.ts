export class CommercialBankEthiopiaValidationReportDto {
  data: {
    registrationProgramId: number;
    fullNameUsedForTheMatch: string;
    bankAccountNumberUsedForCall: string;
    cbeName: string;
    cbeStatus: string;
    errorMessage: string;
  }[];
  fileName: string;
}
