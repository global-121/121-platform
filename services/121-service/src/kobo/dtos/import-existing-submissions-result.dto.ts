import { ApiProperty } from '@nestjs/swagger';

export interface SubmissionValidationError {
  readonly column: string;
  readonly error: string;
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
    description:
      'Validation errors grouped by submission identifier (Kobo UUID). Each key is a submission UUID, and the value is an array of validation errors for that submission.',
    example: {
      'abc-123-def': [
        { column: 'phoneNumber', error: 'Value is not valid' },
        { column: 'fullName', error: 'Value is required' },
      ],
    },
  })
  public validationErrorsPerSubmission: Record<
    string,
    SubmissionValidationError[]
  >;
}
