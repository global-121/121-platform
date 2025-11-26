import { ApiProperty } from '@nestjs/swagger';

import { CooperativeBankOfOromiaAccountValidationReportRecordDto } from '@121-service/src/payments/reconciliation/cooperative-bank-of-oromia-reconciliation/dtos/cooperative-bank-of-oromia-account-validation-report-record.dto';

export class CooperativeBankOfOromiaAccountValidationReportDto {
  @ApiProperty({
    isArray: true,
    type: CooperativeBankOfOromiaAccountValidationReportRecordDto,
  })
  data: CooperativeBankOfOromiaAccountValidationReportRecordDto[];
  @ApiProperty()
  fileName: string;
}
