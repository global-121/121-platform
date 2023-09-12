import { LanguageEnum } from '../enum/language.enum';

export enum LanguageLabelEnum {
  English = 'English',
  Arabic = 'Arabic',
  Filipino = 'Filipino',
  Portuguese = 'Portuguese',
  Indonesian = 'Indonesian',
  Dutch = 'Dutch',
  Spanish = 'Spanish',
  French = 'French',
  Turkish = 'Turkish',
}

type LanguageMappingType = {
  [key in LanguageEnum]: LanguageLabelEnum;
};

export const LanguageMapping: LanguageMappingType = {
  en: LanguageLabelEnum.English,
  ar: LanguageLabelEnum.Arabic,
  tl: LanguageLabelEnum.Filipino,
  pt_BR: LanguageLabelEnum.Portuguese,
  in: LanguageLabelEnum.Indonesian,
  nl: LanguageLabelEnum.Dutch,
  es: LanguageLabelEnum.Spanish,
  fr: LanguageLabelEnum.French,
  tr: LanguageLabelEnum.Turkish,
};
