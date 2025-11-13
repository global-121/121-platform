import { Language } from '@121-service/src/shared/types/language.type';
import { TranslationFull } from '@121-service/src/shared/types/translation-full.type';

/**
 * "Partial translation" means that there may be 0..n keys for languages in
 * TLanguage.
 */
export type TranslationPartial<TLanguage extends Language> = Partial<
  TranslationFull<TLanguage>
>;
