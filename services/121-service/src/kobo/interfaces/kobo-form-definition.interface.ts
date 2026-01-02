import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';

export interface KoboFormDefinition {
  name: string;
  survey: KoboSurveyItemCleaned[];
  languages: (string | undefined)[];
  dateDeployed: Date;
  versionId: string;
}
