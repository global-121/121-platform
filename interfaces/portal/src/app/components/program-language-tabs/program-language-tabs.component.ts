import { NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  model,
  TemplateRef,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { TabsModule } from 'primeng/tabs';

import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

import { ProgramApiService } from '~/domains/program/program.api.service';
import { getLinguonym } from '~/utils/get-linguonym';
import { getUserPreferredUILanguage } from '~/utils/locale';

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
  readonly selectedTabLanguage =
    model.required<RegistrationPreferredLanguage>();

  readonly languageTemplate =
    contentChild<TemplateRef<unknown>>('languageTemplate');

  readonly programApiService = inject(ProgramApiService);

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

    for (const language of this.programLanguages()) {
      labels.set(
        language,
        getLinguonym({
          languageToDisplayNameOf: language,
          languageToShowNameIn: getUserPreferredUILanguage(),
        }),
      );
    }
    return labels;
  });
}
