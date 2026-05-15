import { NgTemplateOutlet } from '@angular/common';
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

import { UILanguage } from '../../../../../../services/121-service/src/shared/enum/ui-language.enum';

import { ProgramApiService } from '~/domains/program/program.api.service';

@Component({
  selector: 'app-program-language-tabs',
  imports: [TabsModule, NgTemplateOutlet],
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

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  readonly programLanguages = computed(
    () => this.program.data()?.languages ?? [],
  );

  updateCurrentLanguage = effect(() => {
    if (this.programLanguages().length === 1) {
      const languageKey = this.programLanguages()[0];
      const uiLanguage: UILanguage | undefined =
        UILanguage[languageKey as keyof typeof UILanguage];
      this.currentLanguage.set(uiLanguage);
    }
  });
}
