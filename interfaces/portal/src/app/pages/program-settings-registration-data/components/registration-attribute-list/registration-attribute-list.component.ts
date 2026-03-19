import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';

import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import {
  ProgramRegistrationAttribute,
  ProgramRegistrationAttributeApiService,
} from '~/domains/program-registration-attribute/program-registration-attribute.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

type AttributeEditFormValue = Record<string, boolean | string>;

@Component({
  selector: 'app-registration-attribute-list',
  imports: [
    ButtonModule,
    CheckboxModule,
    FormDialogComponent,
    FormFieldWrapperComponent,
    InputTextModule,
    ReactiveFormsModule,
    SkeletonModule,
    TableModule,
  ],
  templateUrl: './registration-attribute-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class RegistrationAttributeListComponent {
  readonly programId = input.required<string>();

  private readonly programApiService = inject(ProgramApiService);
  private readonly attributeApiService = inject(
    ProgramRegistrationAttributeApiService,
  );
  private readonly translatableStringService = inject(
    TranslatableStringService,
  );
  readonly toastService = inject(ToastService);

  readonly editDialog =
    viewChild.required<FormDialogComponent<AttributeEditFormValue>>(
      'editDialog',
    );

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );

  readonly editingAttribute = signal<ProgramRegistrationAttribute | null>(null);

  readonly programLanguages = computed(
    () => this.program.data()?.languages ?? [],
  );

  readonly attributes = computed(
    () => this.program.data()?.programRegistrationAttributes ?? [],
  );

  readonly editFormGroup = computed(() => {
    const attribute = this.editingAttribute();
    const languages = this.programLanguages();

    const controls: Record<string, FormControl<boolean | string>> = {
      duplicateCheck: new FormControl<boolean>(
        attribute?.duplicateCheck ?? false,
        { nonNullable: true },
      ),
    };

    for (const lang of languages) {
      controls[lang] = new FormControl<string>(
        (attribute?.label as Record<string, string> | null)?.[lang] ?? '',
        { nonNullable: true },
      );
    }

    return new FormGroup(controls);
  });

  readonly updateAttributeMutation = injectMutation(() => ({
    mutationFn: (formValue: AttributeEditFormValue) => {
      const attribute = this.editingAttribute();
      if (!attribute) {
        throw new Error('No attribute selected for editing');
      }

      const languages = this.programLanguages();
      const updatedLabel: Record<string, string> = {
        ...(attribute.label as Record<string, string> | null),
      };
      for (const lang of languages) {
        const value = formValue[lang];
        if (typeof value === 'string') {
          updatedLabel[lang] = value;
        }
      }

      return this.attributeApiService.updateProgramRegistrationAttribute({
        programId: this.programId,
        attributeName: attribute.name,
        update: {
          label: updatedLabel,
          duplicateCheck: !!formValue['duplicateCheck'],
        },
      });
    },
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Registration attribute updated.`,
      });
    },
  }));

  getTranslatedLabel(attribute: ProgramRegistrationAttribute): string {
    return (
      this.translatableStringService.translate(
        // The attribute label type is RegistrationPreferredLanguageTranslation which is
        // structurally compatible with UILanguageTranslation at runtime
        attribute.label as UILanguageTranslation,
      ) ?? attribute.name
    );
  }

  getFormControl(key: string): FormControl {
    return this.editFormGroup().get(key) as FormControl;
  }

  openEditDialog(attribute: ProgramRegistrationAttribute) {
    this.editingAttribute.set(attribute);
    this.editDialog().show();
  }
}
