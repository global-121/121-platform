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

import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

import { ProjectApiService } from '~/domains/project/project.api.service';
import { LANGUAGE_ENUM_LABEL } from '~/domains/registration/registration.helper';

@Component({
  selector: 'app-project-language-tabs',
  imports: [TabsModule, NgTemplateOutlet],
  templateUrl: './project-language-tabs.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectLanguageTabsComponent {
  readonly projectId = input.required<number | string>();
  readonly currentLanguage = model.required<LanguageEnum>();

  readonly languageTemplate =
    contentChild<TemplateRef<unknown>>('languageTemplate');

  readonly projectApiService = inject(ProjectApiService);

  readonly project = injectQuery(
    this.projectApiService.getProject(this.projectId),
  );

  LANGUAGE_ENUM_LABEL = LANGUAGE_ENUM_LABEL;

  readonly projectLanguages = computed(
    () => this.project.data()?.languages ?? [],
  );

  updateCurrentLanguage = effect(() => {
    if (this.projectLanguages().length === 1) {
      this.currentLanguage.set(this.projectLanguages()[0]);
    }
  });
}
