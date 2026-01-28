import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

const { numeric, text, dropdown } = RegistrationAttributeTypes;
type TypeMapping = Record<string, RegistrationAttributeTypes>;
export const KOBO_TO_121_TYPE_MAPPING: TypeMapping = {
  // numeric
  decimal: numeric,
  integer: numeric,
  range: numeric,
  // dropdown
  select_one: dropdown,
  select_one_from_file: dropdown,
  // text
  'background-audio': text,
  'xml-external': text,
  acknowledge: text,
  audio: text,
  barcode: text,
  calculate: text,
  date: text,
  dateTime: text,
  file: text,
  geopoint: text,
  geoshape: text,
  geotrace: text,
  hidden: text,
  image: text,
  rank: text,
  select_multiple_from_file: text,
  select_multiple: text,
  text,
  time: text,
  video: text,
};
