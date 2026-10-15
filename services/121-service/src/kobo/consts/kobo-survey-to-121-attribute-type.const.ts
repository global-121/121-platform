import { KoboSurveyItemType } from '@121-service/src/kobo/enum/kobo-survey-item-type';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

const { numeric, text, dropdown, koboImage } = RegistrationAttributeTypes;
type TypeMapping = Record<KoboSurveyItemType, RegistrationAttributeTypes>;

export const KOBO_TO_121_TYPE_MAPPING: TypeMapping = {
  // numeric
  [KoboSurveyItemType.decimal]: numeric,
  [KoboSurveyItemType.integer]: numeric,
  [KoboSurveyItemType.range]: numeric,
  // dropdown
  [KoboSurveyItemType.select_one]: dropdown,
  // text
  [KoboSurveyItemType['background-audio']]: text,
  [KoboSurveyItemType['xml-external']]: text,
  [KoboSurveyItemType.acknowledge]: text,
  [KoboSurveyItemType.audio]: text,
  [KoboSurveyItemType.barcode]: text,
  [KoboSurveyItemType.calculate]: text,
  [KoboSurveyItemType.date]: text,
  [KoboSurveyItemType.dateTime]: text,
  [KoboSurveyItemType.file]: text,
  [KoboSurveyItemType.geopoint]: text,
  [KoboSurveyItemType.geoshape]: text,
  [KoboSurveyItemType.geotrace]: text,
  [KoboSurveyItemType.hidden]: text,
  // Kobo image questions are stored as a koboImage attribute (a URL to the
  // attachment) so the portal can render the image via the proxy endpoint.
  [KoboSurveyItemType.image]: koboImage,
  [KoboSurveyItemType.rank]: text,
  [KoboSurveyItemType.select_multiple_from_file]: text,
  [KoboSurveyItemType.select_multiple]: text,
  [KoboSurveyItemType.text]: text,
  [KoboSurveyItemType.time]: text,
  [KoboSurveyItemType.video]: text,
};
