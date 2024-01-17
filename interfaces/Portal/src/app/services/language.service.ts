import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

export class LanguageOption {
  code: string;
  dir: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private DEFAULT_LANGUAGE_CODE = 'en';
  private DEFAULT_LANGUAGE_DIR = 'ltr';
  private DEFAULT_LANGUAGE_NAME = 'English';
  private USER_PREFERENCE_KEY = 'selectedLanguage';

  private allLocales = environment.locales
    .trim()
    .toLowerCase()
    .split(/\s*,\s*/);

  private availableLanguages: LanguageOption[];

  private currentLanguage: string = this.DEFAULT_LANGUAGE_CODE;

  constructor(private translate: TranslateService) {
    if (!this.translate) {
      return;
    }

    this.setupLanguageSwitchForDOM();

    this.availableLanguages = this.loadLanguages();

    let selectedLanguage = this.getStoredLanguage();

    if (!selectedLanguage) {
      // Start with the users' preferred language
      const browserLanguage = this.translate.getBrowserLang();
      if (browserLanguage && this.allLocales.includes(browserLanguage)) {
        selectedLanguage = browserLanguage;
      }
    }

    // Finally, fall back to English
    if (!selectedLanguage) {
      selectedLanguage = this.DEFAULT_LANGUAGE_CODE;
    }

    this.useLanguage(selectedLanguage);
  }

  private setupLanguageSwitchForDOM() {
    this.translate.onLangChange.subscribe(
      (event: { lang: string; translations: { [key: string]: string } }) => {
        document.documentElement.lang = event.lang;
        document.documentElement.dir = event.translations['_dir'];
      },
    );
  }

  private loadLanguages(): LanguageOption[] {
    if (!this.translate) {
      return [];
    }

    if (!this.allLocales || this.allLocales.length === 0) {
      return [
        this.createLanguageOption(this.DEFAULT_LANGUAGE_CODE, {
          _dir: this.DEFAULT_LANGUAGE_DIR,
          _languageName: this.DEFAULT_LANGUAGE_NAME,
        }),
      ];
    }

    const languages = [];

    // Filter out locales that are missing the translation file
    for (const locale of this.allLocales) {
      this.translate.getTranslation(locale).subscribe({
        next: (localeObject) => {
          languages.push(this.createLanguageOption(locale, localeObject));
          languages.sort(this.sortLanguageOptions);
        },
        error: (error) => {
          console.warn(`Translations-file for "${locale}" missing!`, error);
          if (locale === this.currentLanguage) {
            this.useLanguage(this.DEFAULT_LANGUAGE_CODE);
            this.storeLanguage(this.DEFAULT_LANGUAGE_CODE);
          }
        },
      });
    }

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

  public getLanguages(): LanguageOption[] {
    if (!this.availableLanguages) {
      this.availableLanguages = this.loadLanguages();
    }

    return this.availableLanguages;
  }

  public changeLanguage(languageKey: string): void {
    this.storeLanguage(languageKey);
    window.location.reload();
  }

  private useLanguage(languageKey: string): void {
    this.currentLanguage = languageKey;
    this.translate.use(languageKey);
  }

  private createLanguageOption(
    locale: string,
    localeObject: Extract<
      { _dir: string; _languageName: string },
      { [key: string]: string }
    >,
  ): {
    code: string;
    dir: string;
    name: string;
  } {
    return {
      code: locale,
      dir: localeObject['_dir'],
      name: localeObject['_languageName'],
    };
  }

  private storeLanguage(languageKey: string): void {
    window.localStorage.setItem(this.USER_PREFERENCE_KEY, languageKey);
  }

  private getStoredLanguage(): string | null {
    return window.localStorage.getItem(this.USER_PREFERENCE_KEY);
  }
}
