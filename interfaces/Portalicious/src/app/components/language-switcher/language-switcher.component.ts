import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  effect,
  inject,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import {
  Locale,
  changeLanguage,
  getAvailableLanguages,
  getLocaleLabel,
} from '~/utils/locale';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [FormsModule, DropdownModule],
  templateUrl: './language-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  private locale = inject<Locale>(LOCALE_ID);
  public languages = getAvailableLanguages();
  public selectedLanguage = model(this.locale);
  public selectedLanguageLabel = computed(() =>
    getLocaleLabel(this.selectedLanguage()),
  );

  constructor() {
    effect(() => {
      if (this.selectedLanguage() === this.locale) {
        return;
      }
      changeLanguage(this.selectedLanguage());
    });
  }
}
