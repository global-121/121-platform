import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  LOCALE_ID,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SelectModule } from 'primeng/select';

import {
  changeUILanguage,
  getAvailableUILanguages,
  getLocaleLabel,
  Locale,
} from '~/utils/locale';

@Component({
  selector: 'app-language-switcher',
  imports: [FormsModule, SelectModule],
  templateUrl: './language-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  private locale = inject<Locale>(LOCALE_ID);
  public languages = getAvailableUILanguages();
  public readonly selectedLanguage = model(this.locale);
  public readonly selectedLanguageLabel = computed(() =>
    getLocaleLabel(this.selectedLanguage()),
  );

  constructor() {
    effect(() => {
      if (this.selectedLanguage() === this.locale) {
        return;
      }
      changeUILanguage(this.selectedLanguage());
    });
  }
}
