import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { TranslationFull } from '@121-service/src/shared/types/translation-full.type';

// This type is only used in the portal so also just defined here and not in
// service shared types. If we're going to use it in the backend we should move
// it there.
// The partial version of this type *is* defined in the shared types in the
// backend.

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
