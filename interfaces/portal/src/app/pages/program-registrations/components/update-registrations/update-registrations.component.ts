import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
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

import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import {
  ImportFileDialogComponent,
  ImportFileDialogFormGroup,
} from '~/components/import-file-dialog/import-file-dialog.component';
import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { Registration } from '~/domains/registration/registration.model';
import { DownloadService } from '~/services/download.service';
import { ExportService } from '~/services/export.service';
import {
  ActionDataWithPaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';
import { ToastService } from '~/services/toast.service';
import { TranslatableStringService } from '~/services/translatable-string.service';
import { generateFieldErrors } from '~/utils/form-validation';

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
    ManualLinkComponent,
  ],
  templateUrl: './update-registrations.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class UpdateRegistrationsComponent {
  readonly programId = input.required<string>();
  readonly updateSuccess = output();

  readonly dialogVisible = model<boolean>(false);
  readonly actionData = input<ActionDataWithPaginateQuery<Registration>>();

  readonly downloadService = inject(DownloadService);
  readonly exportService = inject(ExportService);
  readonly registrationApiService = inject(RegistrationApiService);
  readonly registrationAttributeService = inject(RegistrationAttributeService);
  readonly toastService = inject(ToastService);
  readonly translatableStringService = inject(TranslatableStringService);
  readonly metricApiService = inject(MetricApiService);
  readonly paginateQueryService = inject(PaginateQueryService);

  protected registrationAttributes = injectQuery(
    this.registrationAttributeService.getRegistrationAttributes(
      signal({
        programId: this.programId,
      }),
    ),
  );

  readonly csvExportFieldsOptions = computed(() =>
    (this.registrationAttributes.data() ?? [])
      .filter((attribute) => attribute.isEditable)
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

  exportCSVFormFieldErrors = generateFieldErrors(this.exportCSVFormGroup);

  exportByTypeMutation = injectMutation(() =>
    this.exportService.getExportByTypeMutation(
      this.programId,
      this.toastService,
    ),
  );

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

  updateRegistrationsFormFieldErrors = generateFieldErrors(
    this.updateRegistrationsFormGroup,
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
        programId: this.programId,
        file,
        reason,
      });
    },
    meta: {
      invalidateCacheAgainAfterDelay: 500,
    },
    onSuccess: () => {
      this.exportCSVFormGroup.reset();
      this.updateRegistrationsFormGroup.reset();
      this.dialogVisible.set(false);
      this.toastService.showToast({
        summary: $localize`Updating registration(s)`,
        detail: $localize`This might take a few minutes.\n\nClosing this notification will not cancel the update.`,
        severity: 'info',
        showSpinner: true,
      });
      this.updateSuccess.emit();
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

    this.exportByTypeMutation.mutate({
      type: ExportType.registrations,
      paginateQuery: {
        ...this.actionData()?.query,
        select: selectedFields,
        filter: {
          ...this.actionData()?.query.filter,
          status: this.paginateQueryService.extendStatusFilterToExcludeDeleted(
            this.actionData()?.query.filter?.status,
          ),
        },
      },
      format: 'csv',
      filename: `update-registrations`,
    });
  }
}
