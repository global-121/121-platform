import { ApiProperty } from '@nestjs/swagger';

import { ReconciliationFeedbackDto } from '@121-service/src/payments/dto/reconciliation-feedback.dto';
import { AggregateImportResultDto } from '@121-service/src/registration/dto/bulk-import.dto';

export class ImportReconciliationResponseDto {
  @ApiProperty({
    type: [ReconciliationFeedbackDto],
    description: 'The import result',
  })
  importResult: ReconciliationFeedbackDto[];

  @ApiProperty({
    type: AggregateImportResultDto,
    description: 'The aggregate import result',
  })
  aggregateImportResult: AggregateImportResultDto;
}
