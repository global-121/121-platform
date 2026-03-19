import { ApiProperty } from '@nestjs/swagger';

import { AirtelUserLookupReportRecordDto } from '@121-service/src/fsp-integrations/account-management/airtel/dtos/airtel-user-lookup-report-record.dto';

export class AirtelUserLookupReportDto {
  @ApiProperty({
    isArray: true,
    type: AirtelUserLookupReportRecordDto,
  })
  readonly data: AirtelUserLookupReportRecordDto[];
  @ApiProperty()
  readonly fileName: string;
}
