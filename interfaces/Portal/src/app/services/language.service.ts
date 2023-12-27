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
  private DEFAULT_LANGUAGE = 'en';

  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);
  }

  public getLanguages(): LanguageOption[] {
    if (!this.translate) {
      return [];
    }
    const allLocales = environment.locales.trim().split(/\s*,\s*/);
    if (!allLocales || allLocales.length === 0) {
      return [this.getLanguageOption(this.DEFAULT_LANGUAGE)];
    }

    const languages = [];

    // filter out locales that are missing the translation file
    for (const locale of allLocales) {
      this.translate.getTranslation(locale).subscribe({
        next: (localeObject) => {
          languages.push(this.getLanguageOption(locale));
          console.log(localeObject);
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
  }

  private handleMissingFile(error) {
    console.warn(error);
  }

  private getLanguageOption(locale: string) {
    return {
      key: locale,
      name: this.translate.instant(
        `page.program.program-people-affected.language.${locale}`,
      ),
    };
  }
}
