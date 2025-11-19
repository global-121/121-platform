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
 * We use Partial<...> here because translations will often be "incomplete" aka:
 * not have a string for each language.
 */
export type Translation<TLanguage extends Language> = Partial<
  Record<TLanguage, string>
>;
