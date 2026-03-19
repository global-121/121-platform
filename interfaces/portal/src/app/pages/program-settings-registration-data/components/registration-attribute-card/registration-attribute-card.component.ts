import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { ProgramRegistrationAttribute } from '~/domains/program/program.model';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { getLinguonym } from '~/utils/get-linguonym';
import { getUILanguageFromLocale, Locale } from '~/utils/locale';

type EditFormRawValue = Record<string, boolean | string | undefined>;

@Component({
  selector: 'app-registration-attribute-card',
  imports: [
    ButtonModule,
    DialogModule,
    FormErrorComponent,
    FormFieldWrapperComponent,
    InputTextModule,
    ReactiveFormsModule,
    ToggleSwitchModule,
  ],
  templateUrl: './registration-attribute-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class RegistrationAttributeCardComponent {
  private readonly locale = inject<Locale>(LOCALE_ID);
  private readonly currentLocale = getUILanguageFromLocale(this.locale);

  readonly programId = input.required<string>();
  readonly attribute = input.required<ProgramRegistrationAttribute>();
  readonly programLanguages = input.required<RegistrationPreferredLanguage[]>();

  readonly programApiService = inject(ProgramApiService);
  readonly translatableStringService = inject(TranslatableStringService);
  readonly toastService = inject(ToastService);

  readonly isDialogVisible = signal(false);
  readonly editFormGroup = signal<FormGroup | null>(null);

  readonly editDialogHeader = computed(
    () => $localize`Edit` + ` "${this.attribute().name}"`,
  );

  readonly translatedLabel = computed(
    () =>
      this.translatableStringService.translate(this.attribute().label) ??
      this.attribute().name,
  );

  getLanguageDisplayName(lang: RegistrationPreferredLanguage): string {
    return getLinguonym({
      languageToDisplayNameOf: lang,
      languageToShowNameIn: this.currentLocale,
    });
  }

  getLabelFieldLabel(lang: RegistrationPreferredLanguage): string {
    return (
      this.getLanguageDisplayName(lang) + ' ' + $localize`:@@attribute-label:label`
    );
  }

  openEditDialog() {
    const attribute = this.attribute();
    const languages = this.programLanguages();
    const label = (attribute.label ?? {}) as Record<string, string>;

    const controls: Record<string, FormControl> = {
      duplicateCheck: new FormControl(attribute.duplicateCheck, {
        nonNullable: true,
      }),
      showInPeopleAffectedTable: new FormControl(
        attribute.showInPeopleAffectedTable,
        { nonNullable: true },
      ),
      editableInPortal: new FormControl(attribute.editableInPortal, {
        nonNullable: true,
      }),
      includeInTransactionExport: new FormControl(
        attribute.includeInTransactionExport,
        { nonNullable: true },
      ),
    };

    for (const lang of languages) {
      controls[`label_${lang}`] = new FormControl(label[lang] ?? '', {
        nonNullable: true,
      });
    }

    this.editFormGroup.set(new FormGroup(controls));
    this.isDialogVisible.set(true);
  }

  saveChanges() {
    const fg = this.editFormGroup();
    if (!fg) {
      return;
    }

    this.updateMutation.mutate(fg.getRawValue() as EditFormRawValue);
  }

  readonly updateMutation = injectMutation(() => ({
    mutationFn: (formData: EditFormRawValue) => {
      const languages = this.programLanguages();
      const label: Record<string, string> = {};

      for (const lang of languages) {
        const value = formData[`label_${lang}`];
        if (typeof value === 'string') {
          label[lang] = value;
        }
      }

      return this.programApiService.updateProgramRegistrationAttribute({
        programId: this.programId,
        attributeName: this.attribute().name,
        update: {
          label,
          duplicateCheck: formData['duplicateCheck'] as boolean,
          showInPeopleAffectedTable:
            formData['showInPeopleAffectedTable'] as boolean,
          editableInPortal: formData['editableInPortal'] as boolean,
          includeInTransactionExport:
            formData['includeInTransactionExport'] as boolean,
        },
      });
    },
    onSuccess: () => {
      this.isDialogVisible.set(false);
      this.toastService.showToast({
        detail: $localize`Registration attribute saved.`,
      });
    },
  }));
}
