import { Language } from '@121-service/src/shared/types/language.type';

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
 * "Full translation" means that there's a key (and so also a value/translation)
 * for every language in TLanguage.
 */
export type TranslationFull<TLanguage extends Language> = Record<
  TLanguage,
  string
>;
