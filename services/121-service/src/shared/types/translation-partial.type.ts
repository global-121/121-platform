import { Language } from '@121-service/src/shared/types/language.type';
import { TranslationFull } from '@121-service/src/shared/types/translation-full.type';

export type TranslationPartial<TLanguage extends Language> = Partial<
  TranslationFull<TLanguage>
>;
