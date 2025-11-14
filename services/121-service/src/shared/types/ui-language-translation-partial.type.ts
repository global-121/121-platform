import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';
import { TranslationPartial } from '@121-service/src/shared/types/translation-partial.type';

/**
 * An object that contains 0..n string translations for languages the UI
 * supports. Use this if you want to allow incomplete translations.
 *
 * Example:
 * {
 *   ar: 'مرحبا',
 *   en: 'Hello',
 * };
 */
export type UILanguageTranslationPartial = TranslationPartial<UILanguage>;
