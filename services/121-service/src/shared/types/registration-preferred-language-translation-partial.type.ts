import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { TranslationPartial } from '@121-service/src/shared/types/translation-partial.type';

/**
 * An object that contains 0..n string translations for registration preferred
 * languages. Use this if you want to allow incomplete translations.
 *
 * Example
 * {
 *   ar: 'مرحبا',
 *   en: 'Hello',
 *   nl: 'Hallo',
 * };
 */
export type RegistrationPreferredLanguageTranslationPartial =
  TranslationPartial<RegistrationPreferredLanguage>;
