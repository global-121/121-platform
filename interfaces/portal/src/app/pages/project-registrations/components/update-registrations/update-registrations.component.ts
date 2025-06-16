import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import {
  ImportFileDialogComponent,
  ImportFileDialogFormGroup,
} from '~/components/import-file-dialog/import-file-dialog.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { Registration } from '~/domains/registration/registration.model';
import { DownloadService } from '~/services/download.service';
import { ExportService } from '~/services/export.service';
import { ActionDataWithPaginateQuery } from '~/services/paginate-query.service';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type ExportCSVFormGroup =
  (typeof UpdateRegistrationsComponent)['prototype']['exportCSVFormGroup'];

type UpdateRegistrationsFormGroup =
  (typeof UpdateRegistrationsComponent)['prototype']['updateRegistrationsFormGroup'];

@Component({
  selector: 'app-update-registrations',
  imports: [
    ButtonModule,
    ImportFileDialogComponent,
    FormFieldWrapperComponent,
    MultiSelectModule,
    ReactiveFormsModule,
    InputTextModule,
    CheckboxModule,
    FormErrorComponent,
  ],
  templateUrl: './update-registrations.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class UpdateRegistrationsComponent {
  readonly projectId = input.required<string>();
  readonly dialogVisible = model<boolean>(false);
  readonly actionData = input<ActionDataWithPaginateQuery<Registration>>();

  readonly downloadService = inject(DownloadService);
  readonly exportService = inject(ExportService);
  readonly registrationApiService = inject(RegistrationApiService);
  readonly registrationAttributeService = inject(RegistrationAttributeService);
  readonly toastService = inject(ToastService);
  readonly translatableStringService = inject(TranslatableStringService);

  protected registrationAttributes = injectQuery(
    this.registrationAttributeService.getRegistrationAttributes(
      signal({
        projectId: this.projectId,
      }),
    ),
  );

  readonly csvExportFieldsOptions = computed(() =>
    (this.registrationAttributes.data() ?? [])
      .filter(
        (attribute) =>
          attribute.isEditable &&
          // in the context of mass updates, we cannot update phone numbers
          attribute.type !== RegistrationAttributeTypes.tel,
      )
      .map((attribute) => ({
        label: this.translatableStringService.translate(attribute.label),
        value: attribute.name,
      })),
  );

  exportCSVFormGroup = new FormGroup({
    fields: new FormControl<string[]>([], {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required, Validators.minLength(1)],
      nonNullable: true,
    }),
  });

  exportCSVFormFieldErrors = generateFieldErrors<ExportCSVFormGroup>(
    this.exportCSVFormGroup,
    {
      fields: genericFieldIsRequiredValidationMessage,
    },
  );

  exportRegistrationsMutation = injectMutation(() => ({
    mutationFn: this.exportService.getExportListMutation(
      this.projectId,
      this.toastService,
    ),
    onSuccess: ({ exportResult: file, filename }) => {
      this.downloadService.downloadFile({ file, filename });
    },
  }));

  updateRegistrationsFormGroup = new FormGroup({
    reason: new FormControl<string>('', {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
      nonNullable: true,
    }),
    confirmAction: new FormControl<boolean>(false, {
      nonNullable: true,
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.requiredTrue],
    }),
  });

  updateRegistrationsFormFieldErrors =
    generateFieldErrors<UpdateRegistrationsFormGroup>(
      this.updateRegistrationsFormGroup,
      {
        reason: genericFieldIsRequiredValidationMessage,
        confirmAction: genericFieldIsRequiredValidationMessage,
      },
    );

  updateRegistrationsMutation = injectMutation(() => ({
    mutationFn: (
      formValues: ReturnType<ImportFileDialogFormGroup['getRawValue']>,
    ) => {
      const { file } = formValues;

      if (!file) {
        // Should never happen but makes TS happy
        throw new Error('File is required');
      }

      const { reason } = this.updateRegistrationsFormGroup.getRawValue();

      return this.registrationApiService.updateRegistrations({
        projectId: this.projectId,
        file,
        reason,
      });
    },
    onSuccess: () => {
      void this.registrationApiService.invalidateCache({
        projectId: this.projectId,
      });
      this.dialogVisible.set(false);
      this.toastService.showToast({
        summary: $localize`Updating registration(s)`,
        detail: $localize`This might take a few minutes.\n\nClosing this notification will not cancel the update.`,
        severity: 'info',
        showSpinner: true,
      });
      setTimeout(() => {
        // invalidate the cache again after a delay to try and make the changes reflected in the UI
        void this.registrationApiService.invalidateCache({
          projectId: this.projectId,
        });
      }, 500);
    },
  }));

  readonly stepOneLabel = computed(
    () =>
      $localize`Export a CSV for the ${this.actionData()?.count} selected registration(s). Select the columns you want to update.`,
  );

  exportCSVForUpdateRegistrations() {
    this.exportCSVFormGroup.markAllAsTouched();

    if (!this.exportCSVFormGroup.valid) {
      return;
    }

    const selectedFields = [
      'referenceId', // this is always required
      ...this.exportCSVFormGroup.getRawValue().fields,
    ];

    this.exportRegistrationsMutation.mutate({
      type: ExportType.allRegistrations,
      paginateQuery: {
        ...this.actionData()?.query,
        select: selectedFields,
      },
      format: 'csv',
      filename: `update-registrations`,
    });
  }
}
