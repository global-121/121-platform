import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { MultiSelectModule } from 'primeng/multiselect';

import { UpdateProgramRegistrationAttributesBatchDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

const EXCLUDED_ATTRIBUTE_TYPES = [
  RegistrationAttributeTypes.boolean,
  RegistrationAttributeTypes.dropdown,
  RegistrationAttributeTypes.koboImage,
];

@Component({
  selector: 'app-deduplication-card',
  imports: [
    CardEditableComponent,
    DataListComponent,
    MultiSelectModule,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './deduplication-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeduplicationCardComponent {
  readonly programId = input.required<string>();
  readonly isEditing = signal(false);

  readonly programApiService = inject(ProgramApiService);
  readonly translatableStringService = inject(TranslatableStringService);
  readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);

  program = injectQuery(this.programApiService.getProgram(this.programId));

  readonly programRegistrationAttributes = computed(() => {
    if (!this.programId() || !this.program.isSuccess()) {
      return [];
    }

    return this.program
      .data()
      .programRegistrationAttributes.filter(
        (attr) => !EXCLUDED_ATTRIBUTE_TYPES.includes(attr.type),
      )
      .map((attr) => ({
        ...attr,
        labelToShow:
          this.translatableStringService.translate(attr.label) ?? attr.name,
      }));
  });
  readonly selectedOptions = computed(() =>
    this.programRegistrationAttributes().filter((attr) => attr.duplicateCheck),
  );

  readonly dataListData = computed<DataListItem[]>(() => {
    const label = $localize`Duplication fields`;

    if (this.selectedOptions().length === 0) {
      return [
        {
          label,
          type: 'text',
          value: $localize`No duplication field selected`,
          icon: 'pi-exclamation-triangle text-red-500',
        },
      ];
    }

    return [
      {
        label,
        value: this.selectedOptions().map((attr) => attr.name),
        options: this.selectedOptions().map((attr) => ({
          value: attr.name,
          label: attr.label,
        })),
        type: 'tags',
      },
    ];
  });

  readonly canEditAttributes = computed(() =>
    this.authService.hasPermission({
      programId: this.programId(),
      requiredPermission: PermissionEnum.ProgramRegistrationAttributesUPDATE,
    }),
  );

  formGroup = new FormGroup({
    duplicationFields: new FormControl<string[]>([]),
  });

  updateDuplicationAttributesMutation = injectMutation(() => {
    type formGroupRawValueType = typeof this.formGroup.getRawValue;

    return {
      mutationFn: async ({
        formData,
      }: {
        formData: ReturnType<formGroupRawValueType>;
      }) => {
        return this.programApiService.updateProgramRegistrationAttributesInBatch(
          {
            programId: this.programId,
            attributesToUpdate: this.getAttributesToUpdate(
              formData.duplicationFields ?? [],
            ),
          },
        );
      },
      onSuccess: () => {
        this.isEditing.set(false);
        void this.program.refetch();
        this.toastService.showToast({
          detail: $localize`Deduplication indicators saved successfully.`,
        });
      },
      onError: () => {
        this.toastService.showToast({
          severity: 'error',
          detail: $localize`An error occurred while updating.`,
        });
      },
    };
  });
  constructor() {
    effect(() => {
      if (!this.programId()) {
        return;
      }

      this.formGroup.patchValue({
        duplicationFields: this.selectedOptions().map((attr) => attr.name),
      });
    });
  }
  private getAttributesToUpdate(selectedFields: string[]) {
    const attributesToUpdate: UpdateProgramRegistrationAttributesBatchDto[] =
      [];
    const previousSelectedNames = this.selectedOptions().map(
      (attr) => attr.name,
    );

    const deselectedNames = previousSelectedNames.filter(
      (attrName) => !selectedFields.includes(attrName),
    );
    for (const attrName of deselectedNames) {
      attributesToUpdate.push({
        programRegistrationAttributeName: attrName,
        updateProgramRegistrationAttribute: { duplicateCheck: false },
      });
    }

    const newSelections = selectedFields.filter(
      (attrName) => !previousSelectedNames.includes(attrName),
    );
    for (const attrName of newSelections) {
      attributesToUpdate.push({
        programRegistrationAttributeName: attrName,
        updateProgramRegistrationAttribute: { duplicateCheck: true },
      });
    }

    return attributesToUpdate;
  }
}
