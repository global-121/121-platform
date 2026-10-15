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

import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { CardEditableComponent } from '~/components/card-editable/card-editable.component';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import {
  getNameFieldsInConventionOrder,
  sortNameFieldsByAttributeOrder,
} from '~/pages/program-settings-registration-data/components/full-name-card/full-name-card.helper';
import { AuthService } from '~/services/auth.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-full-name-card',
  imports: [
    CardEditableComponent,
    DataListComponent,
    MultiSelectModule,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './full-name-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullNameCardComponent {
  readonly programId = input.required<string>();
  readonly isEditing = signal(false);

  readonly programApiService = inject(ProgramApiService);
  readonly translatableStringService = inject(TranslatableStringService);
  readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);

  program = injectQuery(this.programApiService.getProgram(this.programId));

  readonly textAttributes = computed(() => {
    if (!this.program.isSuccess()) {
      return [];
    }

    return this.program
      .data()
      .programRegistrationAttributes.filter(
        (attribute) => attribute.type === RegistrationAttributeTypes.text,
      )
      .map((attribute) => ({
        name: attribute.name,
        labelToShow:
          this.translatableStringService.translate(attribute.label) ??
          attribute.name,
      }));
  });

  readonly selectedNameFields = computed(() => {
    if (!this.program.isSuccess()) {
      return [];
    }

    return getNameFieldsInConventionOrder({
      textAttributes: this.textAttributes(),
      fullnameNamingConvention:
        this.program.data().fullnameNamingConvention ?? [],
    });
  });

  readonly dataListData = computed<DataListItem[]>(() => {
    const label = $localize`Name fields`;

    if (this.selectedNameFields().length === 0) {
      return [
        {
          label,
          type: 'text',
          value: $localize`No name field selected`,
          icon: 'pi-exclamation-triangle text-red-500 ms-1',
        },
      ];
    }

    return [
      {
        label,
        value: this.selectedNameFields().map((attribute) => attribute.name),
        options: this.selectedNameFields().map((attribute) => ({
          value: attribute.name,
          label: attribute.labelToShow,
        })),
        type: 'tags',
      },
    ];
  });

  readonly canEdit = computed(
    () =>
      this.program.isSuccess() &&
      this.authService.hasPermission({
        programId: this.programId(),
        requiredPermission: PermissionEnum.ProgramUPDATE,
      }),
  );

  formGroup = new FormGroup({
    nameFields: new FormControl<string[]>([], { nonNullable: true }),
  });

  updateFullnameNamingConventionMutation = injectMutation(() => ({
    mutationFn: async ({ nameFields }: { nameFields: string[] }) =>
      this.programApiService.updateProgram({
        programId: this.programId,
        programPatch: {
          fullnameNamingConvention: sortNameFieldsByAttributeOrder({
            textAttributes: this.textAttributes(),
            nameFields,
          }),
        },
      }),
    onSuccess: () => {
      this.toastService.showToast({
        detail: $localize`Full name saved successfully.`,
      });
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`An error occurred while updating.`,
      });
    },
  }));

  constructor() {
    effect(() => {
      if (this.isEditing()) {
        return;
      }

      this.formGroup.patchValue({
        nameFields: this.selectedNameFields().map(
          (attribute) => attribute.name,
        ),
      });
    });
  }
}
