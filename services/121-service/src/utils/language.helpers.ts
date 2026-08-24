import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';

/**
 * Validates and resolves language parameter for exports.
 * If language is valid UILanguage, returns it (cast to RegistrationPreferredLanguage).
 * Otherwise, defaults to English.
 * @param language - Language parameter from query string (optional, any string)
 * @returns Valid language code as string, defaults to 'en'
 */
export function resolveExportLanguage(language?: string): string {
  if (!language) {
    return UILanguage.en;
  }

  // Check if language is a valid UILanguage enum value
  if (Object.values(UILanguage).includes(language as UILanguage)) {
    return language;
  }

  // Fallback to English for any invalid/unknown language
  return UILanguage.en;
}
