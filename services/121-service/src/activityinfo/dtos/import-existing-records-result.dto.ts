import { ApiProperty } from '@nestjs/swagger';

class RecordValidationError {
  @ApiProperty({
    description: 'The reference ID of the record that failed validation',
    example: 'c4dl5f8lh1x8ybdl',
  })
  public readonly referenceId: string;

  @ApiProperty({
    description: 'The column that failed validation',
    example: 'phoneNumber',
  })
  public readonly column: string;

  @ApiProperty({
    description: 'The error message describing the validation failure',
    example: 'Value is not valid',
  })
  public readonly error: string;
}

export class ImportExistingRecordsResultDto {
  @ApiProperty({
    description: 'Total number of records on the ActivityInfo form',
  })
  public numberOfRecordsOnForm: number;

  @ApiProperty({
    description: 'Number of records successfully imported',
  })
  public numberOfRecordsImported: number;

  @ApiProperty({
    description: 'Number of records skipped because they were already imported',
  })
  public numberOfRecordsSkipped: number;

  @ApiProperty({
    description: 'Number of records that failed validation',
  })
  public numberOfRecordsFailed: number;

  @ApiProperty({
    type: [RecordValidationError],
    description:
      'Flat list of validation errors. Each entry includes the record referenceId, the column that failed, and the error message.',
  })
  public validationErrors: RecordValidationError[];
}
