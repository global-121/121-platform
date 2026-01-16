import { KoboChoiceDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-choice.dto';
import { KoboSurveyItemDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-survey-item.dto';

export interface KoboAssetDto {
  name: string;
  content: {
    survey: KoboSurveyItemDto[];
    choices: KoboChoiceDto[];
  };
  summary: {
    languages: string[];
  };
  date_deployed: Date;
  version_id: string;
}
