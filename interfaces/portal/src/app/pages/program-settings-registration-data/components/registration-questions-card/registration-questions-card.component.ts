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

import { UILanguage } from '../../../../../../../../services/121-service/src/shared/enum/ui-language.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { ProgramLanguageTabsComponent } from '~/components/program-language-tabs/program-language-tabs.component';
import { getTranslatableFormGroup } from '~/components/program-language-tabs/program-language-tabs.helper';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { Attribute } from '~/domains/program/program.model';
import { ToastService } from '~/services/toast.service';

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
  ],
  templateUrl: './registration-questions-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationQuestionsCardComponent {
  readonly programId = input.required<number | string>();

  readonly programApiService = inject(ProgramApiService);

  RegistrationPreferredLanguage = RegistrationPreferredLanguage;

  readonly programAttributes = injectQuery(() => ({
    ...this.programApiService.getProgramRegistrationAttributesWithUntranslatedLabels(
      {
        programId: this.programId,
      },
    )(),
    enabled: !!this.programId(),
  }));

  readonly cardSubtitle = computed(() => {
    if (!this.programAttributes.isSuccess()) {
      return ``;
    }

    const programAttributesLength = this.programAttributes.data().length;
    return $localize`Below are the ${programAttributesLength.toString()} questions from the linked Kobo form. Please edit each label to a shorter version which will be displayed in the table of the registration page and on the profile page.\n\nThe default language is set by the language of the instance.`;
  });

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  readonly toastService = inject(ToastService);

  formGroup = new FormGroup<
    Record<
      string,
      FormGroup<
        Partial<Record<RegistrationPreferredLanguage, FormControl<string>>>
      >
    >
  >({});

  readonly currentLanguage = model(UILanguage.en);

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
            getInitialValue: () => this.labelToShow(attribute)(),
          }),
        ]),
      ),
    );
  });

  readonly labelToShow = (attribute: Attribute) =>
    computed(() => {
      const { label, koboLabel, name } = attribute;

      if (label) {
        const labelToShow = label[this.currentLanguage()];
        if (labelToShow) {
          return labelToShow;
        }
      }

      if (koboLabel) {
        const labelToShow = koboLabel[this.currentLanguage()];
        if (labelToShow) {
          return labelToShow;
        }
      }

      return name;
    });
}
