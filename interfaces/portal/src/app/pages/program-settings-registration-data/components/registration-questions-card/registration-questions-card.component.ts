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

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';

import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';

import { UpdateProgramRegistrationAttributesBatchDto } from '../../../../../../../../services/121-service/src/programs/dto/program-registration-attribute.dto';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { ProgramLanguageTabsComponent } from '~/components/program-language-tabs/program-language-tabs.component';
import { getTranslatableFormGroup } from '~/components/program-language-tabs/program-language-tabs.helper';
import { isKoboIntegrated } from '~/domains/kobo/kobo.helpers';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
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
  private readonly koboApiService = inject(KoboApiService);

  readonly koboIntegration = injectQuery(() => ({
    ...this.koboApiService.getKoboIntegration(this.programId)(),
    enabled: !!this.programId(),
  }));

  readonly isKoboIntegrated = computed<boolean>(() =>
    isKoboIntegrated(this.koboIntegration),
  );

  readonly isSupportedUILanguage = isSupportedUILanguage;

  RegistrationPreferredLanguage = RegistrationPreferredLanguage;

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  readonly programAttributes = computed(() => {
    if (!this.program.isSuccess()) {
      return [];
    }
    return this.program.data().programRegistrationAttributes;
  });

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

  updateAttributeLabelsMutation = injectMutation(() => ({
    mutationFn: async (
      formData: ReturnType<typeof this.formGroup.getRawValue>,
    ) => {
      const attributesToUpdate: UpdateProgramRegistrationAttributesBatchDto[] =
        [];

      for (const attributeName of Object.keys(formData)) {
        const label: Record<string, string> = {};
        const attributeLabel = formData[attributeName];
        for (const language of Object.keys(attributeLabel)) {
          const translatedLabel = attributeLabel[language] as
            | string
            | undefined;
          if (translatedLabel) {
            label[language] = translatedLabel;
          }

          attributesToUpdate.push({
            programRegistrationAttributeName: attributeName,
            updateProgramRegistrationAttribute: { label },
          });
        }
      }

      return this.programApiService.updateProgramRegistrationAttributesInBatch({
        programId: this.programId,
        attributesToUpdate,
      });
    },
    onSuccess: () => {
      this.isEditing.set(false);
      this.toastService.showToast({
        detail: $localize`Update successful.`,
      });
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`An error occurred while updating the labels.`,
      });
    },
  }));

  readonly isEditing = model(false);

  readonly selectedTabLanguage = model(
    getUILanguageFromLocale(
      environment.defaultLocale as unknown as Locale,
    ) as unknown as RegistrationPreferredLanguage,
  );

  defineFormGroup = effect(() => {
    if (!this.program.isSuccess()) {
      return;
    }

    const program = this.program.data();
    const programAttributes = this.programAttributes();
    this.formGroup = new FormGroup(
      Object.fromEntries(
        programAttributes.map((attribute) => [
          attribute.name,
          getTranslatableFormGroup({
            program,
            getInitialValue: (language) =>
              this.attributeLabels().get(attribute.name)?.get(language),
          }),
        ]),
      ),
    );
  });

  readonly attributeLabels = computed(() => {
    const programAttributes = this.programAttributes();
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

  readonly cardHeader = computed(() =>
    this.isKoboIntegrated()
      ? $localize`Registration questions`
      : $localize`Required fields`,
  );

  readonly tableHeaderLabelTooltipMessage = computed(() => {
    const labelDescription = $localize`The label that will be shown in the registration page table header and registration's profile.`;
    const editInstruction = $localize`The labels cand be edited by clicking on the pencil icon above.`;
    return this.isKoboIntegrated()
      ? `${labelDescription} ${editInstruction}`
      : labelDescription;
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
