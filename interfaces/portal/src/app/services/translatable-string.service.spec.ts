import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { TranslatableStringService } from '~/services/translatable-string.service';

describe('TranslatableStringService', () => {
  let service: TranslatableStringService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TranslatableStringService,
        { provide: LOCALE_ID, useValue: 'nl' },
      ],
    });
    service = TestBed.inject(TranslatableStringService);
  });

  describe('translate', () => {
    it('should return undefined for null', () => {
      expect(service.translate(null)).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      expect(service.translate(undefined)).toBeUndefined();
    });

    it('should return undefined for empty translation object', () => {
      expect(service.translate({})).toBeUndefined();
    });

    it('should return number as string', () => {
      expect(service.translate(123)).toBe('123');
    });

    it('should return string as is', () => {
      expect(service.translate('hello')).toBe('hello');
    });

    it('should return translation for current locale', () => {
      const translations: UILanguageTranslation = {
        [UILanguage.nl]: 'hallo',
        [UILanguage.en]: 'hi',
      };
      expect(service.translate(translations)).toBe('hallo');
    });

    it('should fallback to English if current locale not present', () => {
      const translations: UILanguageTranslation = {
        [UILanguage.en]: 'hello',
        [UILanguage.fr]: 'bonjour',
      };
      expect(service.translate(translations)).toBe('hello');
    });

    it('should return first available translation if no locale or fallback', () => {
      const translations: UILanguageTranslation = {
        [UILanguage.fr]: 'bonjour',
        [UILanguage.es]: 'hola',
      };
      expect(service.translate(translations)).toBe('bonjour');
    });
  });

  describe('commaSeparatedList', () => {
    it('should return comma separated string for array of strings', () => {
      const result = service.commaSeparatedList({ values: ['a', 'b', 'c'] });
      expect(result).toContain('a');
      expect(result).toContain('b');
      expect(result).toContain('c');
    });

    it('should return comma separated string for array of UILanguageTranslation', () => {
      const translations: UILanguageTranslation[] = [
        { [UILanguage.nl]: 'een', [UILanguage.en]: 'one' },
        { [UILanguage.nl]: 'twee', [UILanguage.en]: 'two' },
      ];
      const result = service.commaSeparatedList({ values: translations });
      expect(result).toContain('een');
      expect(result).toContain('twee');
    });

    it('should return a sorted list by default', () => {
      const translations: UILanguageTranslation[] = [
        { [UILanguage.nl]: 'een', [UILanguage.en]: 'one' },
        { [UILanguage.nl]: 'twee', [UILanguage.en]: 'two' },
        { [UILanguage.nl]: 'drie', [UILanguage.en]: 'three' },
      ];
      const result = service.commaSeparatedList({ values: translations });
      expect(result).toBe('drie, een, twee');
    });

    it('should return an unsorted list when specified', () => {
      const translations: UILanguageTranslation[] = [
        { [UILanguage.nl]: 'een', [UILanguage.en]: 'one' },
        { [UILanguage.nl]: 'twee', [UILanguage.en]: 'two' },
        { [UILanguage.nl]: 'drie', [UILanguage.en]: 'three' },
      ];
      const result = service.commaSeparatedList({
        values: translations,
        sortedAlphabetically: false,
      });
      expect(result).toBe('een, twee, drie');
    });

    it('should handle empty array', () => {
      expect(service.commaSeparatedList({ values: [] })).toBe('');
    });

    it('should use correct locale formatting', () => {
      const translations: UILanguageTranslation[] = [
        { [UILanguage.nl]: 'een', [UILanguage.en]: 'one' },
        { [UILanguage.nl]: 'twee', [UILanguage.en]: 'two' },
        { [UILanguage.nl]: 'drie', [UILanguage.en]: 'three' },
      ];
      const result = service.commaSeparatedList({
        values: translations,
        style: 'long',
      });
      expect(result).toContain('een');
      expect(result).toContain('twee');
      expect(result).toContain('drie');
    });
  });
});
