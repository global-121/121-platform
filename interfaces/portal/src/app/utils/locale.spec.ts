import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';

import { getLocaleForInitialization, Locale } from '~/utils/locale';

describe('getLocaleForInitialization', () => {
  const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

  beforeEach(() => {
    getItemSpy.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    getItemSpy.mockClear();
    localStorage.clear();
  });

  it('should throw an error when an invalid default locale is passed in', () => {
    // Act & Assert
    expect(() => {
      getLocaleForInitialization({
        defaultLocale: 'nonsense',
        urlLocale: 'en-GB',
      });
    }).toThrow('Invalid default locale "nonsense" found in environment.');
  });

  it('should throw an error when an invalid url locale is passed in', () => {
    // Act & Assert
    expect(() => {
      getLocaleForInitialization({
        defaultLocale: 'en-GB',
        urlLocale: 'nonsense',
      });
    }).toThrow('Invalid locale "nonsense" found in URL:');
  });

  it('should always use the default locale in dev mode', () => {
    // Arrange
    getItemSpy.mockReturnValue(UILanguage.nl);

    // Act
    const localeInfo = getLocaleForInitialization({
      defaultLocale: 'en-GB',
      urlLocale: 'nonsense',
      isDevMode: true,
    });

    // Assert
    expect(localeInfo).toEqual({ locale: Locale.en });
  });

  it('should default to the urlLocale whenever there is weirdness saved in local storage', () => {
    // Arrange
    getItemSpy.mockReturnValue('nonsense');

    // Act
    const localeInfo = getLocaleForInitialization({
      defaultLocale: 'en-GB',
      urlLocale: UILanguage.nl,
    });

    // Assert
    expect(localeInfo).toEqual({ locale: Locale.nl });
  });

  it('should use the default locale when there is nothing saved in local storage', () => {
    // Arrange
    getItemSpy.mockReturnValue(null);

    // Act
    let localeInfo = getLocaleForInitialization({
      defaultLocale: 'en-GB',
      urlLocale: 'en-GB',
    });

    // Assert
    expect(localeInfo).toEqual({ locale: Locale.en });

    // Act
    localeInfo = getLocaleForInitialization({
      defaultLocale: UILanguage.nl,
      urlLocale: UILanguage.nl,
    });

    // Assert
    expect(localeInfo).toEqual({ locale: Locale.nl });
  });

  it('should prompt to change language when the local storage locale is out of sync with the url locale', () => {
    // Arrange
    getItemSpy.mockImplementation(() => UILanguage.nl);

    // Act
    const localeInfo = getLocaleForInitialization({
      defaultLocale: 'en-GB',
      urlLocale: 'en-GB',
    });

    // Assert
    expect(localeInfo).toEqual({
      localStorageLocale: Locale.nl,
      localeIsOutOfSyncWithUrl: true,
    });
  });

  it('should prompt to change language when the local storage locale does not exist and the url locale does not match the default locale', () => {
    // Arrange
    getItemSpy.mockImplementation(() => null);

    // Act
    const localeInfo = getLocaleForInitialization({
      defaultLocale: UILanguage.nl,
      urlLocale: 'en-GB',
    });

    // Assert
    expect(localeInfo).toEqual({
      localStorageLocale: Locale.nl,
      localeIsOutOfSyncWithUrl: true,
    });
  });
});
