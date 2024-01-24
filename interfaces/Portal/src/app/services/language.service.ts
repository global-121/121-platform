import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

export class LanguageOption {
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private DEFAULT_LANGUAGE_CODE = 'en';
  private USER_PREFERENCE_KEY = 'selectedLanguage';

  // These locale/language codes should match the filenames in: `src/assets/i18n/<code>.json`
  private SUPPORTED_LANGUAGES = {
    ar: 'العربية',
    en: 'English',
    es: 'Español',
    fr: 'Français',
    nl: 'Nederlands',
  };

  private enabledLocales = environment.locales
    .trim()
    .toLowerCase()
    .split(/\s*,\s*/);

  constructor(private translate: TranslateService) {
    if (!this.translate) {
      return;
    }

    this.setupLanguageSwitchForDOM();
  }

  public setup(): void {
    let selectedLanguage = this.getStoredLanguage();

    if (!selectedLanguage) {
      // Start with the users' preferred language
      const browserLanguage = this.translate.getBrowserLang();
      if (browserLanguage && this.enabledLocales.includes(browserLanguage)) {
        selectedLanguage = browserLanguage;
      }
    }

    // Finally, fall back to English
    if (!selectedLanguage) {
      selectedLanguage = this.DEFAULT_LANGUAGE_CODE;
    }

    this.translate.use(selectedLanguage);
  }

  private setupLanguageSwitchForDOM() {
    this.translate.onLangChange.subscribe(
      (event: { lang: string; translations: { [key: string]: string } }) => {
        document.documentElement.lang = event.lang;
        document.documentElement.dir = event.translations['_dir'];
      },
    );
  }

  public getLanguages(): LanguageOption[] {
    if (!this.enabledLocales || this.enabledLocales.length === 0) {
      return [
        {
          code: this.DEFAULT_LANGUAGE_CODE,
          name: this.SUPPORTED_LANGUAGES[this.DEFAULT_LANGUAGE_CODE],
        },
      ];
    }

    const languages = this.enabledLocales.map((locale) => {
      return {
        code: locale,
        name: this.SUPPORTED_LANGUAGES[locale],
      };
    });

    languages.sort(this.sortLanguageOptions);

    return languages;
  }

  private sortLanguageOptions(
    a: LanguageOption,
    b: LanguageOption,
  ): -1 | 0 | 1 {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    if (a.code < b.code) return -1;
    if (a.code > b.code) return 1;
    return 0;
  }

  public changeLanguage(languageKey: string): void {
    this.storeLanguage(languageKey);
    window.location.reload();
  }

  private storeLanguage(languageKey: string): void {
    window.localStorage.setItem(this.USER_PREFERENCE_KEY, languageKey);
  }

  private getStoredLanguage(): string | null {
    return window.localStorage.getItem(this.USER_PREFERENCE_KEY);
  }
}
