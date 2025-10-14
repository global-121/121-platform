import { ApiProperty } from '@nestjs/swagger';

import { ReconciliationFeedbackDto } from '@121-service/src/payments/dto/reconciliation-feedback.dto';
import { ExcelAggregateImportResultDto } from '@121-service/src/payments/reconciliation/excel/dtos/excel-aggregate-import-result.dto';

export class ImportReconciliationResponseDto {
  @ApiProperty({
    type: [ReconciliationFeedbackDto],
    description: 'The import result',
  })
  readonly importResult: ReconciliationFeedbackDto[];

  @ApiProperty({
    type: ExcelAggregateImportResultDto,
    description: 'The aggregate import result',
  })
  readonly aggregateImportResult: ExcelAggregateImportResultDto;
}
