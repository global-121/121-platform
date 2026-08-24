import { resolveExportLanguage } from '@121-service/src/utils/language.helpers';

describe('resolveExportLanguage', () => {
  describe('valid languages', () => {
    it('should return "en" for English', () => {
      expect(resolveExportLanguage('en')).toBe('en');
    });

    it('should return "nl" for Dutch', () => {
      expect(resolveExportLanguage('nl')).toBe('nl');
    });

    it('should return "fr" for French', () => {
      expect(resolveExportLanguage('fr')).toBe('fr');
    });

    it('should return "ar" for Arabic', () => {
      expect(resolveExportLanguage('ar')).toBe('ar');
    });

    it('should return "es" for Spanish', () => {
      expect(resolveExportLanguage('es')).toBe('es');
    });

    it('should return "sk" for Slovak', () => {
      expect(resolveExportLanguage('sk')).toBe('sk');
    });
  });

  describe('invalid languages', () => {
    it('should return "en" for unknown language code', () => {
      expect(resolveExportLanguage('xx')).toBe('en');
    });

    it('should return "en" for invalid language string', () => {
      expect(resolveExportLanguage('invalid')).toBe('en');
    });

    it('should return "en" for uppercase language code', () => {
      expect(resolveExportLanguage('NL')).toBe('en');
    });

    it('should return "en" for language with typo', () => {
      expect(resolveExportLanguage('nle')).toBe('en');
    });
  });

  describe('missing language', () => {
    it('should return "en" when language is undefined', () => {
      expect(resolveExportLanguage(undefined)).toBe('en');
    });

    it('should return "en" when language is empty string', () => {
      expect(resolveExportLanguage('')).toBe('en');
    });
  });
});
