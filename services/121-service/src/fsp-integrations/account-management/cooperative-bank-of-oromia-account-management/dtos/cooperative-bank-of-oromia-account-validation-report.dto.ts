import { ApiProperty } from '@nestjs/swagger';

import { CooperativeBankOfOromiaAccountValidationReportRecordDto } from '@121-service/src/fsp-integrations/account-management/cooperative-bank-of-oromia-account-management/dtos/cooperative-bank-of-oromia-account-validation-report-record.dto';

export class CooperativeBankOfOromiaAccountValidationReportDto {
  @ApiProperty({
    isArray: true,
    type: CooperativeBankOfOromiaAccountValidationReportRecordDto,
  })
  readonly data: CooperativeBankOfOromiaAccountValidationReportRecordDto[];
  @ApiProperty()
  readonly fileName: string;
}
