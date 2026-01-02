import { KoboChoiceDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-choice.dto';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';

export interface KoboFormDefinition {
  name: string;
  survey: KoboSurveyItemCleaned[];
  choices: KoboChoiceDto[];
  languages: string[];
  dateDeployed: Date;
  versionId: string;
}
