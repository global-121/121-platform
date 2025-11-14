import { UILanguageTranslationPartial } from '@121-service/src/shared/types/ui-language-translation-partial.type';

export class ValueExtractor {
  // Function to get the 'en' value or fallback to the first object property value
  static getLocalizedStringOrFallback(
    value: UILanguageTranslationPartial | unknown, // Use unknown if the value could be anything
  ): string | null {
    if (typeof value === 'object' && value !== null) {
      return (
        (value as UILanguageTranslationPartial)?.en || Object.values(value)[0]
      );
    }
    return null;
  }

  // Function to get the value depending on its type
  static getValue(value: unknown): string | null {
    if (typeof value === 'string' || typeof value === 'number') {
      return value.toString();
    }

    if (ValueExtractor.isObject(value)) {
      return ValueExtractor.getLocalizedStringOrFallback(value);
    }

    return null;
  }

  // Utility function to check if a value is an object
  private static isObject(value: unknown): value is object {
    return value !== null && typeof value === 'object';
  }
}
