import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';
import { TranslationPartial } from '@121-service/src/shared/types/translation-partial.type';

/**
 * An object that contains 0..n string translations for languages the UI
 * supports. Use this if you want to allow incomplete translations.
 *
 * For what "partial translation" means, see TranslationPartial.
 *
 * The non-English UI languages will often be incompletely translated because
 * each time we add a string to the source language (English) it can take some
 * time for the translations of that string to be completed. This also means
 * that for any particular field of this type, some languages may be missing.
 * For the UI languages we prioritize the percentage of non-translated strings
 * will be low though.
 *
 * Example:
 * {
 *   ar: 'مرحبا',
 *   en: 'Hello',
 * };
 */
export type UILanguageTranslationPartial = TranslationPartial<UILanguage>;
