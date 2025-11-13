import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { TranslationFull } from '@121-service/src/shared/types/translation-full.type';

/**
 * An object that contains string translations *for each registration preferred
 * language*. Use this if you want to enforce having a translation for each
 * registration preferred language.
 *
 * Example (if all registration preferred languages would be ar, ay, en, nl):
 * {
 *   ar: 'مرحبا',
 *   ay: 'kamisaraki',
 *   en: 'Hello',
 *   nl: 'Hallo',
 * };
 */
export type RegistrationPreferredLanguageTranslationFull =
  TranslationFull<RegistrationPreferredLanguage>;
