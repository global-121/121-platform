import { TitleCasePipe } from '@angular/common';
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
  changeLocale,
  getAvailableLocales,
  getLocaleLabel,
  Locale,
} from '~/utils/locale';

@Component({
  selector: 'app-locale-switcher',
  imports: [FormsModule, SelectModule],
  providers: [TitleCasePipe],
  templateUrl: './locale-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocaleSwitcherComponent {
  private locale = inject<Locale>(LOCALE_ID);
  private titleCasePipe = inject(TitleCasePipe);

  public locales = getAvailableLocales().map((locale) => ({
    label: this.titleCasePipe.transform(locale.label),
    value: locale.value,
  }));
  public readonly selectedLocale = model(this.locale);
  public readonly selectedLocaleLabel = computed(() =>
    this.titleCasePipe.transform(getLocaleLabel(this.selectedLocale())),
  );

  constructor() {
    effect(() => {
      if (this.selectedLocale() === this.locale) {
        return;
      }
      changeLocale(this.selectedLocale());
    });
  }
}
