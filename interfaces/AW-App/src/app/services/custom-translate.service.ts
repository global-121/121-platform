import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CustomTranslateService {
  constructor(public translateService: TranslateService) {}

  public translate(messageKey) {
    let result: string;
    this.translateService.get(messageKey).subscribe((message: string) => {
      result = message;
    });
    return result;
  }
}
