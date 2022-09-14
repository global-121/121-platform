import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslatableStringService } from './translatable-string.service';

describe('TranslatableStringService', () => {
  const testInputObject = {
    test: 'test input in TestLanguage',
    en: 'test input in English',
    nl: 'test input in het Nederlands',
  };
  let service: TranslatableStringService;
  let translateService: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          defaultLanguage: 'test',
        }),
      ],
      providers: [],
    });
    service = TestBed.inject(TranslatableStringService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return "empty string" value for "invalid" input', () => {
    expect(service.get(undefined)).toBe('');
    expect(service.get(null)).toBe('');
  });

  it('should return "string" value for "string" input', () => {
    const testInput = 'test input as string';

    expect(service.get(testInput)).toBe(testInput);
  });

  it('should return "fallback"-language value for any input', () => {
    const testInput = testInputObject;

    expect(service.get(testInput)).toBe(testInput.test);
  });

  it('should return "en" value when "en" language is set', () => {
    const testInput = testInputObject;
    translateService.use('en');

    expect(service.get(testInput)).toBe(testInput.en);
  });

  it('should return "nl" value when "nl" language is set', () => {
    const testInput = testInputObject;
    translateService.use('nl');

    expect(service.get(testInput)).toBe(testInput.nl);
  });

  it('should return "fallback" value when "incorrect" language is set', () => {
    const testInput = testInputObject;
    translateService.use('incorrect');

    expect(service.get(testInput)).toBe(testInput.test);
  });
});
