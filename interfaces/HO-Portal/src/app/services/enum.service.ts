import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class EnumService {
  constructor(private translate: TranslateService) {}

  private enumerableAttributes = ['preferredLanguage'];

  public isEnumerableAttribute(attributeName: string): boolean {
    return this.enumerableAttributes.includes(attributeName);
  }

  public getEnumLabel(attributeName: string, value: string): string {
    switch (attributeName) {
      case 'preferredLanguage':
        return this.getPreferredLanguageLabel(value);
      default:
        return '';
    }
  }

  private getPreferredLanguageLabel(value: string): string {
    if (!value || value === '-') {
      return '-';
    }
    return this.translate.instant(
      'page.program.program-people-affected.language.' + value,
    );
  }
}
