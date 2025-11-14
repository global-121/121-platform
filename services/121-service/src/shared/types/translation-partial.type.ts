import { Language } from '@121-service/src/shared/types/language.type';
import { TranslationFull } from '@121-service/src/shared/types/translation-full.type';

/**
 * Example:
 * {
 *   ar: 'مرحبا'
 *   en: 'Hello',
 *   nl: 'Hallo',
 * };
 *
 * TLanguage can be either RegistrationPreferredLanguage or UILanguage.
 *
 * "Partial translation" means that a variable of this type *may* have a key for
 * a given language.
 */
export type TranslationPartial<TLanguage extends Language> = Partial<
  TranslationFull<TLanguage>
>;
