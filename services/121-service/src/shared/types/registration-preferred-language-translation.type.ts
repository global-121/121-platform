import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { Translation } from '@121-service/src/shared/types/translation.type';

/**
 * An object that contains 0..n string translations for registration preferred
 * languages.
 *
 * Example
 * {
 *   ar: 'مرحبا',
 *   en: 'Hello',
 *   nl: 'Hallo',
 * };
 */
export type RegistrationPreferredLanguageTranslation =
  Translation<RegistrationPreferredLanguage>;
