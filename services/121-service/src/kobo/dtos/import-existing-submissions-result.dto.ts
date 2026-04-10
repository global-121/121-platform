import { ApiProperty } from '@nestjs/swagger';

export class SubmissionValidationError {
  @ApiProperty({
    description: 'The reference ID of the submission that failed validation',
    example: 'abc-123-def',
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

export class ImportExistingSubmissionsResultDto {
  @ApiProperty({
    description: 'Total number of submissions on the Kobo form',
  })
  public numberOfSubmissionsOnForm: number;

  @ApiProperty({
    description: 'Number of submissions successfully imported',
  })
  public numberOfSubmissionsImported: number;

  @ApiProperty({
    description:
      'Number of submissions skipped because they were already imported',
  })
  public numberOfSubmissionsSkipped: number;

  @ApiProperty({
    description: 'Number of submissions that failed validation',
  })
  public numberOfSubmissionsFailed: number;

  @ApiProperty({
    type: [SubmissionValidationError],
    description:
      'Flat list of validation errors. Each entry includes the submission referenceId, the column that failed, and the error message.',
  })
  public validationErrors: SubmissionValidationError[];
}
