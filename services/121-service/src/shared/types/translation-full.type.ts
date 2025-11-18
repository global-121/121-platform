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
 *
 * This type should be used for enforcing the presence of translations for all
 * languages. One example is the linguonyms of registration preferred languages,
 * which should always be present for all supported registration preferred
 * languages.
 */
export type TranslationFull<TLanguage extends Language> = Record<
  TLanguage,
  string
>;
