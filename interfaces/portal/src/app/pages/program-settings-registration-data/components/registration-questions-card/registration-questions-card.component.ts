import { TitleCasePipe, UpperCasePipe } from '@angular/common';
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
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';

import { UpdateProgramRegistrationAttributesBatchDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { UILanguage } from '@121-service/src/shared/enum/ui-language.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { Attribute } from '~/domains/program/program.model';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { getLinguonym } from '~/utils/get-linguonym';
import {
  getUILanguageFromLocale,
  getUserPreferredUILanguage,
  isSupportedUILanguage,
  Locale,
} from '~/utils/locale';
import { environment } from '~environment';

@Component({
  selector: 'app-registration-questions-card',
  imports: [
    CardModule,
    CardEditableComponent,
    TableModule,
    ReactiveFormsModule,
    InputTextModule,
    CardEditableComponent,
    InfoTooltipComponent,
    TabsModule,
    TitleCasePipe,
    UpperCasePipe,
    TagModule,
  ],
  templateUrl: './registration-questions-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationQuestionsCardComponent {
  readonly programId = input.required<number | string>();

  readonly programApiService = inject(ProgramApiService);
  readonly authService = inject(AuthService);

  readonly isSupportedUILanguage = isSupportedUILanguage;

  RegistrationPreferredLanguage = RegistrationPreferredLanguage;

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  readonly programAttributes = computed(() => {
    if (!this.program.isSuccess()) {
      return [];
    }

    return this.program
      .data()
      .programRegistrationAttributes.sort((a, b) => (a.name > b.name ? 1 : -1));
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
        }
        attributesToUpdate.push({
          programRegistrationAttributeName: attributeName,
          updateProgramRegistrationAttribute: { label },
        });
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
    const formGroupObject = Object.fromEntries(
      this.programAttributes().map((attribute) => [
        attribute.name,
        new FormGroup(
          Object.fromEntries(
            this.programLanguages().map((language) => [
              language,
              new FormControl(
                this.attributeLabels().get(attribute.name)?.get(language),
                {
                  nonNullable: true,
                },
              ),
            ]),
          ),
        ),
      ]),
    );
    this.formGroup = new FormGroup(formGroupObject);
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

  readonly canEditAttributes = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.RegistrationAttributeUPDATE,
    }),
  );

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
