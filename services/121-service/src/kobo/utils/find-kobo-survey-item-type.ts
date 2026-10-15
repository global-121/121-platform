import { KoboSurveyItemType } from '@121-service/src/kobo/enum/kobo-survey-item-type';

export const findKoboSurveyItemType = ({
  rawType,
}: {
  rawType: string;
}): KoboSurveyItemType | undefined => {
  return Object.values(KoboSurveyItemType).find(
    (knownType) => knownType === rawType,
  );
};
