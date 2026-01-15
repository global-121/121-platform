import { Test, TestingModule } from '@nestjs/testing';

import { KoboLanguageExtracterService } from '@121-service/src/kobo/services/kobo-language-extracter.service';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

describe('KoboLanguageExtracterService', () => {
  let service: KoboLanguageExtracterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KoboLanguageExtracterService],
    }).compile();

    service = module.get<KoboLanguageExtracterService>(
      KoboLanguageExtracterService,
    );
  });

  it('should extract valid ISO codes from kobo languages', () => {
    // Arrange
    const koboLanguages = [
      'English (en)',
      'Dutch (nl)',
      'French (fr)',
      'Arabic (ar)',
    ];

    // Act
    const result = service.getLanguageIsoCodes({ koboLanguages });

    // Assert
    expect(result).toEqual([
      RegistrationPreferredLanguage.en,
      RegistrationPreferredLanguage.nl,
      RegistrationPreferredLanguage.fr,
      RegistrationPreferredLanguage.ar,
    ]);
  });

  it('should return empty array when no valid ISO codes found', () => {
    // Arrange
    const koboLanguages = ['Invalid Language'];

    // Act
    const result = service.getLanguageIsoCodes({ koboLanguages });

    // Assert
    expect(result).toEqual([]);
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
    const result = service.getLanguageIsoCodes({ koboLanguages });

    // Assert
    expect(result).toEqual([
      RegistrationPreferredLanguage.en,
      RegistrationPreferredLanguage.es,
      RegistrationPreferredLanguage.ti,
    ]);
  });
});
