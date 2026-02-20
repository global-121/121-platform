import { KoboLanguageMapper } from '@121-service/src/kobo/mappers/kobo-language.mapper';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

describe('KoboLanguageMapper', () => {
  describe('getLanguageIsoCodes', () => {
    it('should extract valid ISO codes from Kobo languages', () => {
      // Arrange
      const koboLanguages = [
        'English (en)',
        'Dutch (nl)',
        'French (fr)',
        'Arabic (ar)',
      ];

      // Act
      const result = KoboLanguageMapper.getLanguageIsoCodes({ koboLanguages });

      // Assert
      expect(result).toIncludeSameMembers([
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
        RegistrationPreferredLanguage.fr,
        RegistrationPreferredLanguage.ar,
      ]);
    });

    it('should return empty array when no valid ISO codes found', () => {
      // Arrange
      const koboLanguages = [
        'Invalid Language',
        'Another Invalid',
        'No ISO Code Here',
      ];

      // Act
      const result = KoboLanguageMapper.getLanguageIsoCodes({ koboLanguages });

      // Assert
      expect(result).toBeArrayOfSize(0);
    });

    it('should handle mixed valid and invalid languages', () => {
      // Arrange
      const koboLanguages = [
        'English (en)',
        'Invalid Language',
        'Spanish (es)',
        'No ISO Code',
        'Tigrinya (ti)',
      ];

      // Act
      const result = KoboLanguageMapper.getLanguageIsoCodes({ koboLanguages });

      // Assert
      expect(result).toIncludeSameMembers([
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.es,
        RegistrationPreferredLanguage.ti,
      ]);
    });
  });

  describe('extractIsoCode', () => {
    it('should return undefined when koboSurveyLanguage is undefined', () => {
      // Arrange
      const koboSurveyLanguage = undefined;

      // Act
      const result = KoboLanguageMapper.extractIsoCode({
        koboSurveyLanguage,
      });

      // Assert
      expect(result).toBeUndefined();
    });

    it('should correctly extract ISO code from valid Kobo language string', () => {
      // Arrange
      const koboSurveyLanguage = 'English (en)';

      // Act
      const result = KoboLanguageMapper.extractIsoCode({
        koboSurveyLanguage,
      });

      // Assert
      expect(result).toBe(RegistrationPreferredLanguage.en);
    });

    it('should return undefined when string does not contain valid language code', () => {
      // Arrange
      const koboSurveyLanguage = 'Invalid Language';

      // Act
      const result = KoboLanguageMapper.extractIsoCode({
        koboSurveyLanguage,
      });

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
