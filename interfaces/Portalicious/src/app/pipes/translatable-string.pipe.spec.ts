import { LOCALE_ID, enableProdMode } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { Locale } from '~/utils/locale';

describe('TranslatableStringPipe', () => {
  const testInputObject = {
    test: 'test input in TestLanguage',
    en: 'test input in English',
    nl: 'test input in het Nederlands',
  };
  let pipe: TranslatableStringPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LOCALE_ID,
          useValue: Locale.en,
        },
        TranslatableStringPipe,
      ],
    });

    enableProdMode();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return "empty string" value for "invalid" input', () => {
    // Arrange
    pipe = TestBed.inject(TranslatableStringPipe);
    // Act
    // Assert
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(null)).toBe('');
  });

  it('should return "string" value for "string" input', () => {
    // Arrange
    const testInput = 'test input as string';
    pipe = TestBed.inject(TranslatableStringPipe);

    // Act
    // Assert
    expect(pipe.transform(testInput)).toBe(testInput);
  });

  it('should return "fallback"-language("en") value for any input', () => {
    // Arrange
    const testInput = testInputObject;
    pipe = TestBed.inject(TranslatableStringPipe);

    // Act
    // Assert
    expect(pipe.transform(testInput)).toBe(testInput.en);
  });

  it('should return "nl" value when "nl" language is set', () => {
    // Arrange
    const testInput = testInputObject;
    TestBed.overrideProvider(LOCALE_ID, {
      useValue: Locale.nl,
    });
    pipe = TestBed.inject(TranslatableStringPipe);

    // Act
    // Assert
    expect(pipe.transform(testInput)).toBe(testInput.nl);
  });

  it('should return "fallback" value when "incorrect" language is set', () => {
    // Arrange
    const testInput = testInputObject;
    TestBed.overrideProvider(LOCALE_ID, {
      useValue: 'XX',
    });
    pipe = TestBed.inject(TranslatableStringPipe);

    // Act
    // Assert
    expect(pipe.transform(testInput)).toBe(testInput.en);
  });

  it('should return "any" value when fallback "en" translation is not available', () => {
    // Arrange
    const testInput = {
      nl: testInputObject.nl,
      test: testInputObject.test,
    };
    pipe = TestBed.inject(TranslatableStringPipe);

    // Act
    // Assert
    expect(pipe.transform(testInput)).toBe(testInput.nl);
  });
});
