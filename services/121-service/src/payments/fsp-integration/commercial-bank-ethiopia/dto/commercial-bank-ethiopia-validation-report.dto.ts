export class CommercialBankEthiopiaValidationReportDto {
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
