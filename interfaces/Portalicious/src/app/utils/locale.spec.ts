import { enableProdMode } from '@angular/core';
import { getLocaleForInitialization, Locale } from '~/utils/locale';

describe('getLocaleForInitialization', () => {
  beforeEach(() => {
    enableProdMode();
  });

  it('should throw an error when an invalid default locale is passed in', () => {
    expect(function () {
      getLocaleForInitialization({
        defaultLocale: 'nonsense',
        urlLocale: 'en',
      });
    }).toThrowError('Invalid default locale "nonsense" found in environment.');
  });

  it('should throw an error when an invalid url locale is passed in', () => {
    expect(function () {
      getLocaleForInitialization({
        defaultLocale: 'en',
        urlLocale: 'nonsense',
      });
    }).toThrowError('Invalid locale "nonsense" found in URL: /context.html');
  });

  it('should default to the urlLocale whenever there is weirdness saved in local storage', () => {
    spyOn(window.localStorage, 'getItem').and.callFake(() => 'nonsense');

    const localeInfo = getLocaleForInitialization({
      defaultLocale: 'en',
      urlLocale: 'nl',
    });

    expect(localeInfo).toEqual({ locale: Locale.nl });
  });

  it('should use the default locale when there is nothing saved in local storage', () => {
    spyOn(window.localStorage, 'getItem').and.callFake(() => null);

    let localeInfo = getLocaleForInitialization({
      defaultLocale: 'en',
      urlLocale: 'en',
    });

    expect(localeInfo).toEqual({ locale: Locale.en });

    localeInfo = getLocaleForInitialization({
      defaultLocale: 'nl',
      urlLocale: 'nl',
    });

    expect(localeInfo).toEqual({ locale: Locale.nl });
  });

  it('should prompt to change language when the local storage locale is out of sync with the url locale', () => {
    spyOn(window.localStorage, 'getItem').and.callFake(() => 'nl');

    const localeInfo = getLocaleForInitialization({
      defaultLocale: 'en',
      urlLocale: 'en',
    });

    expect(localeInfo).toEqual({
      localStorageLocale: Locale.nl,
      localeIsOutOfSyncWithUrl: true,
    });
  });

  it('should prompt to change language when the local storage locale does not exist and the url locale does not match the default locale', () => {
    spyOn(window.localStorage, 'getItem').and.callFake(() => null);

    const localeInfo = getLocaleForInitialization({
      defaultLocale: 'nl',
      urlLocale: 'en',
    });

    expect(localeInfo).toEqual({
      localStorageLocale: Locale.nl,
      localeIsOutOfSyncWithUrl: true,
    });
  });
});
