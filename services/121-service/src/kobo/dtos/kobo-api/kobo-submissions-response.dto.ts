import { KoboSubmissionDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-submission.dto';

/**
 * Represents the paginated response from Kobo's
 * GET /api/v2/assets/{uid}/data/ endpoint.
 * Uses Django REST Framework pagination format.
 */
export interface KoboSubmissionsResponseDto {
  readonly count: number;
  readonly next: string | null;
  readonly previous: string | null;
  readonly results: KoboSubmissionDto[];
}
