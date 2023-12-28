import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

export class LanguageOption {
  key: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private DEFAULT_LANGUAGE_KEY = 'en';
  private DEFAULT_LANGUAGE_LABEL = 'ENGLISH';

  private selectedLanguage: string;

  constructor(private translate: TranslateService) {
    if (!this.translate) {
      return;
    }
    this.translate.setDefaultLang(this.DEFAULT_LANGUAGE_KEY);

    if (!this.selectedLanguage && !this.getStoredLanguage()) {
      this.selectedLanguage = this.DEFAULT_LANGUAGE_KEY;
      this.storeLanguage();
    }

    this.selectedLanguage = this.getStoredLanguage();

    this.translate.use(this.selectedLanguage);
  }

  public getLanguages(): LanguageOption[] {
    if (!this.translate) {
      return [];
    }
    const allLocales = environment.locales.trim().split(/\s*,\s*/);
    if (!allLocales || allLocales.length === 0) {
      return [
        this.getLanguageOption(this.DEFAULT_LANGUAGE_KEY, {
          _languageLabel: this.DEFAULT_LANGUAGE_LABEL,
        }),
      ];
    }

    const languages = [];

    // filter out locales that are missing the translation file
    for (const locale of allLocales) {
      this.translate.getTranslation(locale).subscribe({
        next: (localeObject) => {
          languages.push(this.getLanguageOption(locale, localeObject));
        },
        error: this.handleMissingFile,
      });
    }

    return languages;
  }

  public changeLanguage(languageKey: string) {
    if (!this.translate) {
      return;
    }
    this.translate.use(languageKey);
    this.selectedLanguage = languageKey;
    this.storeLanguage();
    window.location.reload();
    document.documentElement.dir = this.translate.instant('_dir');
  }

  private handleMissingFile(error) {
    console.warn(error);
  }

  private getLanguageOption(locale: string, localeObject: any) {
    return {
      key: locale,
      name: localeObject['_languageLabel'],
    };
  }

  public getSelectedLanguage(): string {
    return this.selectedLanguage;
  }

  private storeLanguage() {
    localStorage.setItem('selectedLanguage', this.selectedLanguage);
  }

  private getStoredLanguage(): string {
    return localStorage.getItem('selectedLanguage');
  }
}
