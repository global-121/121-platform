import { ApiProperty } from '@nestjs/swagger';

class CommercialBankEthiopiaValidationReportData {
  @ApiProperty()
  registrationProgramId: number;
  @ApiProperty()
  fullNameUsedForTheMatch: string;
  @ApiProperty()
  bankAccountNumberUsedForCall: string;
  @ApiProperty()
  cbeName: string;
  @ApiProperty()
  cbeStatus: string;
  @ApiProperty()
  errorMessage: string;
  @ApiProperty()
  updated: string;
}

export class CommercialBankEthiopiaValidationReportDto {
  @ApiProperty({
    isArray: true,
    type: CommercialBankEthiopiaValidationReportData,
  })
  data: CommercialBankEthiopiaValidationReportData[];
  @ApiProperty()
  fileName: string;
}
