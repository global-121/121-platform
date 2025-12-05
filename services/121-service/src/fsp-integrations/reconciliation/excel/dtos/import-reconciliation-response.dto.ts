import { ApiProperty } from '@nestjs/swagger';

import { ExcelAggregateImportResultDto } from '@121-service/src/fsp-integrations/reconciliation/excel/dtos/excel-aggregate-import-result.dto';
import { ReconciliationFeedbackDto } from '@121-service/src/fsp-integrations/reconciliation/excel/dtos/reconciliation-feedback.dto';

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
