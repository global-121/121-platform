import { ApiProperty } from '@nestjs/swagger';

import { InstanceReportingRegistrationDto } from '@121-service/src/instance-reporting/dtos/instance-reporting-registration.dto';
import { InstanceReportingTransactionDto } from '@121-service/src/instance-reporting/dtos/instance-reporting-transaction.dto';

export class PushInstanceReportingDataResponseDto {
  @ApiProperty({ type: [InstanceReportingRegistrationDto] })
  readonly registrations: InstanceReportingRegistrationDto[];

  @ApiProperty({ type: [InstanceReportingTransactionDto] })
  readonly transactions: InstanceReportingTransactionDto[];
}
