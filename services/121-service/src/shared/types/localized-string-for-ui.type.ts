import { UILanguageEnum } from '@121-service/src/shared/enum/ui-language.enum';

/**
 * Example:
 * {
 *   en: 'Hello',
 *   nl: 'Hallo',
 *   ar: 'مرحبا'
 * };
 */
export type LocalizedStringForUI = Partial<Record<UILanguageEnum, string>>;
