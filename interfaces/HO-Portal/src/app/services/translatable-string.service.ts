import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TranslatableString } from '../models/translatable-string.model';

@Injectable({
  providedIn: 'root'
})
export class TranslatableStringService {
  private fallbackLanguageCode: string;
  private languageCode: string;

  constructor(
    private translate: TranslateService,
  ) {
    this.fallbackLanguageCode = this.translate.getDefaultLang();
    this.languageCode = this.translate.currentLang;
  }

  public get(property: TranslatableString | string): string {
    if (typeof property !== 'object') {
      return property;
    }

    let label: any = property[this.languageCode];

    if (!label) {
      label = property[this.fallbackLanguageCode];
    }

    if (!label) {
      label = property;
    }

    return label;
  }
}
