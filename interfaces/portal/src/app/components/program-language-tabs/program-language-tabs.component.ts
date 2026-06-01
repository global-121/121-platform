import { NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  TemplateRef,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { TabsModule } from 'primeng/tabs';

import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';
import { Language } from '@121-service/src/shared/types/language.type';

import { ProgramApiService } from '~/domains/program/program.api.service';
import { getLinguonym } from '~/utils/get-linguonym';
import { environment } from '~environment';

const LOCAL_STORAGE_LOCALE_KEY = 'preferredLanguage';
@Component({
  selector: 'app-program-language-tabs',
  imports: [TabsModule, NgTemplateOutlet, TitleCasePipe],
  templateUrl: './program-language-tabs.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramLanguageTabsComponent {
  readonly programId = input.required<number | string>();
  readonly languages = input.required<RegistrationPreferredLanguage[]>();
  readonly currentLanguage = model.required<RegistrationPreferredLanguage>();

  readonly languageTemplate =
    contentChild<TemplateRef<unknown>>('languageTemplate');

  readonly programApiService = inject(ProgramApiService);

  readonly defaultLocale = localStorage.getItem(LOCAL_STORAGE_LOCALE_KEY);

  readonly portalLanguages = environment.locales
    .split(',')
    .map((locale) => (locale === 'en-GB' ? 'en' : locale));

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  readonly programLanguages = computed(() => {
    if (!this.program.isSuccess()) {
      return [];
    }

    return this.program.data().languages;
  });

  readonly tabLabels = computed(() => {
    const labels = new Map<RegistrationPreferredLanguage, string>();
    let languageToShowNameIn = UILanguage.en;
    if (this.defaultLocale) {
      languageToShowNameIn = this.defaultLocale as UILanguage;
    }
    for (const language of this.programLanguages()) {
      labels.set(
        language,
        getLinguonym({
          languageToDisplayNameOf: language,
          languageToShowNameIn,
        }),
      );
    }
    return labels;
  });

  readonly isDefaultLanguage = (language: Language) =>
    computed(() => language === this.defaultLocale);

  updateCurrentLanguage = effect(() => {
    const languageKey = this.programLanguages()[0];
    this.currentLanguage.set(languageKey);
  });

  readonly currentLanguageLabel = computed(() =>
    this.tabLabels().get(this.currentLanguage()),
  );

  readonly isCurrentLanguageSupported = computed(() => {
    if (!this.program.isSuccess()) {
      return false;
    }

    return this.portalLanguages.includes(this.currentLanguage());
  });
}
