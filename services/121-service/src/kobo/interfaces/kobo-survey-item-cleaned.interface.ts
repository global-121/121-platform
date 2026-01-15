import { KoboChoiceCleaned } from '@121-service/src/kobo/interfaces/kobo-choice-cleaned.interface';

export interface KoboSurveyItemCleaned {
  name: string;
  type: string;
  label?: string[];
  required?: boolean;
  choices: KoboChoiceCleaned[];
}
