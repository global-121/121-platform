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
  readonly currentLanguage = model.required<UILanguage>();

  readonly languageTemplate =
    contentChild<TemplateRef<unknown>>('languageTemplate');

  readonly programApiService = inject(ProgramApiService);

  readonly defaultLocale = localStorage.getItem(LOCAL_STORAGE_LOCALE_KEY);

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  readonly programLanguages = computed(() => {
    if (!this.program.isSuccess()) {
      return [];
    }

    const languages = this.program.data().languages;

    // put the preferred language first
    const reorderedLanguages: RegistrationPreferredLanguage[] = [];
    const preferredLanguage = languages.find((l) => l === this.defaultLocale);
    if (preferredLanguage) {
      reorderedLanguages.push(preferredLanguage);
    }
    reorderedLanguages.push(
      ...languages.filter((l) => l !== preferredLanguage),
    );
    return reorderedLanguages;
  });

  readonly getTabLabel = (language: Language) =>
    computed(() => {
      let languageToShowNameIn = UILanguage.en;
      if (this.defaultLocale) {
        languageToShowNameIn = this.defaultLocale as UILanguage;
      }

      return getLinguonym({
        languageToDisplayNameOf: language,
        languageToShowNameIn,
      });
    });

  readonly isDefaultLanguage = (language: Language) =>
    computed(() => language === this.defaultLocale);

  updateCurrentLanguage = effect(() => {
    const languageKey = this.programLanguages()[0];
    const uiLanguage: UILanguage | undefined =
      UILanguage[languageKey as keyof typeof UILanguage];
    this.currentLanguage.set(uiLanguage);
  });
}
