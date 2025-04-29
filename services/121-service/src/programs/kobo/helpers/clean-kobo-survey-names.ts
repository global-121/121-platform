import { KoboSurveyItem } from '@121-service/src/programs/kobo/interfaces/kobo-survey-item.interface';

export function getCleanAttributeNameFromKoboSurveyItem(
  koboSurveyItem: KoboSurveyItem,
): string | undefined {
  const name = koboSurveyItem.name || koboSurveyItem.$autoname;
  if (name) {
    return getCleanAttributeNameFromKoboSurveyItemName(name);
  }
}

export function getCleanAttributeNameFromKoboSurveyItemName(
  koboSurveyItemName: string,
): string {
  if (koboSurveyItemName.includes('/')) {
    const parts = koboSurveyItemName.split('/');
    return parts[parts.length - 1];
  }
  return koboSurveyItemName;
}
