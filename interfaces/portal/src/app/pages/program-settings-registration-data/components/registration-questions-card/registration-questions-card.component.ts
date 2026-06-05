import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { ProgramLanguageTabsComponent } from '~/components/program-language-tabs/program-language-tabs.component';
import { getTranslatableFormGroup } from '~/components/program-language-tabs/program-language-tabs.helper';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { Attribute } from '~/domains/program/program.model';
import { ToastService } from '~/services/toast.service';
import {
  getUILanguageFromLocale,
  isSupportedUILanguage,
  Locale,
} from '~/utils/locale';
import { environment } from '~environment';

@Component({
  selector: 'app-registration-questions-card',
  imports: [
    CardModule,
    ProgramLanguageTabsComponent,
    CardEditableComponent,
    TableModule,
    ReactiveFormsModule,
    InputTextModule,
    CardEditableComponent,
    InfoTooltipComponent,
  ],
  templateUrl: './registration-questions-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationQuestionsCardComponent {
  readonly programId = input.required<number | string>();

  readonly programApiService = inject(ProgramApiService);

  readonly isSupportedUILanguage = isSupportedUILanguage;

  RegistrationPreferredLanguage = RegistrationPreferredLanguage;

  readonly programAttributes = injectQuery(() => ({
    ...this.programApiService.getProgramRegistrationAttributesWithUntranslatedLabels(
      {
        programId: this.programId,
      },
    )(),
    enabled: !!this.programId(),
  }));

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  readonly programLanguages = computed(() => {
    if (!this.program.isSuccess()) {
      return [];
    }

    return this.program.data().languages;
  });

  readonly toastService = inject(ToastService);

  formGroup = new FormGroup<
    Record<
      string,
      FormGroup<
        Partial<Record<RegistrationPreferredLanguage, FormControl<string>>>
      >
    >
  >({});

  readonly selectedTabLanguage = model(
    getUILanguageFromLocale(
      environment.defaultLocale as unknown as Locale,
    ) as unknown as RegistrationPreferredLanguage,
  );

  defineFormGroup = effect(() => {
    if (!this.program.isSuccess() || !this.programAttributes.isSuccess()) {
      return;
    }

    const program = this.program.data();
    const programAttributes = this.programAttributes.data();
    this.formGroup = new FormGroup(
      Object.fromEntries(
        programAttributes.map((attribute) => [
          attribute.name,
          getTranslatableFormGroup({
            program,
            getInitialValue: () =>
              this.attributeLabels()
                ?.get(attribute.name)
                ?.get(this.selectedTabLanguage()) ?? attribute.name,
          }),
        ]),
      ),
    );
  });

  readonly attributeLabels = computed(() => {
    if (!this.programAttributes.isSuccess()) {
      return;
    }
    const programAttributes = this.programAttributes.data();
    const labels = new Map<
      string,
      Map<RegistrationPreferredLanguage, string | undefined>
    >();

    for (const attribute of programAttributes) {
      const labelsToShow = new Map<
        RegistrationPreferredLanguage,
        string | undefined
      >();
      for (const language of this.programLanguages()) {
        labelsToShow.set(
          language,
          this.getLabelToShow({ language, attribute }),
        );
      }
      labels.set(attribute.name, labelsToShow);
    }

    return labels;
  });

  private getLabelToShow({
    language,
    attribute,
  }: {
    language: RegistrationPreferredLanguage;
    attribute: Attribute;
  }) {
    return (
      attribute.label?.[language as unknown as UILanguage] ??
      attribute.koboLabel?.[language as unknown as UILanguage] ??
      undefined
    );
  }
}
