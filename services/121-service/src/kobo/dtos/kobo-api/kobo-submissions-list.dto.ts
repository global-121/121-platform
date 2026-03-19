import { KoboSubmissionDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-submission.dto';

/**
 * Represents the paginated response from the Kobo submissions list API.
 */
export interface KoboSubmissionsListDto {
  count: number;
  next: string | null;
  previous: string | null;
  results: KoboSubmissionDto[];
}
