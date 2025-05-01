import { KoboChoice } from '@121-service/src/programs/kobo/interfaces/kobo-choice.interface';
import { KoboSurveyItem } from '@121-service/src/programs/kobo/interfaces/kobo-survey-item.interface';

/**
 * Response from Kobo API containing form definition and metadata
 */
export interface KoboFormResponse {
  name: string;
  survey: KoboSurveyItem[];
  choices: KoboChoice[];
  languages: string[];
  dateDeployed: Date;
  versionId: string;
}
