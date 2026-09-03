import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { ActivityInfoValidationError } from '@121-service/src/activityinfo/interfaces/activityinfo-validation-error.interface';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';

import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { getChipDataByRecordsKey } from '~/components/colored-chip/colored-chip.helper';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import { QueryTableColumn } from '~/components/query-table/query-table.types';
import { ImportExistingRecordsResultKey } from '~/domains/activityinfo/activityinfo.helpers';
import { ActivityInfoApiService } from '~/domains/activityinfo/activityinfo-api.service';
import { DialogState } from '~/pages/program-settings-registration-data/components/activityinfo-import-existing-records-dialog/activityinfo-import-existing-records-dialog-state.enum';
import { ActivityInfoIntegrationErrorDialogComponent } from '~/pages/program-settings-registration-data/components/activityinfo-integration-error-dialog/activityinfo-integration-error-dialog.component';
import { ToastService } from '~/services/toast.service';

interface ValidationError {
  referenceId: string;
  column: string;
  error: string;
}

interface ValidationErrorTableRow extends ValidationError {
  id: number;
}

@Component({
  selector: 'app-activityinfo-import-existing-records-dialog',
  imports: [
    DialogModule,
    ButtonModule,
    ColoredChipComponent,
    QueryTableComponent,
    FormErrorComponent,
    InfoTooltipComponent,
    ActivityInfoIntegrationErrorDialogComponent,
  ],
  providers: [ToastService],
  templateUrl: './activityinfo-import-existing-records-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityInfoImportExistingRecordsDialogComponent {
  private readonly activityInfoApiService = inject(ActivityInfoApiService);
  private readonly toastService = inject(ToastService);

  readonly importState = signal(DialogState.NotInitiated);
  readonly dialogVisible = model(false);
  readonly programId = input.required<number | string>();

  readonly activityInfoIntegrationErrors = signal<
    ActivityInfoValidationError[]
  >([]);

  readonly activityInfoIntegrationErrorDialog =
    viewChild.required<ActivityInfoIntegrationErrorDialogComponent>(
      'activityInfoIntegrationErrorDialog',
    );

  readonly headerIcon = computed(() => {
    switch (this.importState()) {
      case DialogState.ImportedWithErrors:
        return 'pi pi-exclamation-triangle me-2';
      case DialogState.ImportedWithoutErrors:
        return 'pi pi-check me-2';
      case DialogState.NotInitiated:
        return 'pi pi-download me-2';
      case DialogState.ImportedWithoutRecords:
        return 'pi pi-exclamation-circle me-2';
    }
  });

  readonly dialogTitle = computed(() => {
    switch (this.importState()) {
      case DialogState.ImportedWithErrors:
        return $localize`Import complete with errors`;
      case DialogState.ImportedWithoutErrors:
        return $localize`Import complete`;
      case DialogState.NotInitiated:
        return $localize`Import existing registrations`;
      case DialogState.ImportedWithoutRecords:
        return $localize`No records found`;
    }
  });

  readonly dialogWidth = computed(() =>
    this.importState() === DialogState.ImportedWithErrors ? '70rem' : '42rem',
  );

  readonly noExistingRecordsTranslation = computed(
    () =>
      $localize`ActivityInfo form ”${this.activityInfoIntegration.data()?.name}” does not have any records yet.`,
  );

  readonly totalRecordsTranslation = computed(
    () =>
      $localize`${this.importExistingRecords.data()?.numberOfRecordsOnForm ?? 0}:count: total record(s)`,
  );

  readonly activityInfoIntegration = injectQuery(() => ({
    ...this.activityInfoApiService.getActivityInfoIntegration(this.programId)(),
    enabled: !!this.programId(),
  }));

  readonly importExistingRecords = injectMutation(() => ({
    mutationFn: () =>
      this.activityInfoApiService.importExistingRecords(this.programId),
    onSuccess: (response) => {
      if (response.validationErrors.length) {
        this.importState.set(DialogState.ImportedWithErrors);
      }

      if (response.validationErrors.length === 0) {
        this.importState.set(DialogState.ImportedWithoutErrors);
      }

      if (response.numberOfRecordsOnForm === 0) {
        this.importState.set(DialogState.ImportedWithoutRecords);
      }
    },
    onError: (errorResponse: Error) => {
      const cause = errorResponse.cause as {
        error?: { errors?: ActivityInfoValidationError[] };
      };
      const errors = cause.error?.errors;

      // If the error contains ActivityInfo validation errors, show them in the
      // ActivityInfoIntegrationErrorDialog instead of only a toast.
      if (Array.isArray(errors) && errors.length > 0) {
        this.activityInfoIntegrationErrors.set(errors);
        this.closeDialog();
        this.activityInfoIntegrationErrorDialog().show();
      }

      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Error while importing existing ActivityInfo records`,
      });
    },
  }));

  readonly singleErrorMessage = computed(
    () => this.importExistingRecords.failureReason()?.message,
  );

  readonly detailedErrors = computed(() => {
    const errors = this.importExistingRecords.data()?.validationErrors;

    if (!errors?.length) {
      return undefined;
    }

    // The table requires an id on every row.
    return errors.map(
      (error: ValidationError, index: number): ValidationErrorTableRow => {
        // The registration stores the FSP under programFspConfigurationName,
        // but the form author knows the field by its code, 'fsp'.
        if (
          error.column ===
          GenericRegistrationAttributes.programFspConfigurationName.toString()
        ) {
          return { ...error, column: 'fsp', id: index };
        }

        return { ...error, id: index };
      },
    );
  });

  readonly detailedErrorsColumns = computed<
    QueryTableColumn<ValidationErrorTableRow>[]
  >(() => [
    {
      field: 'referenceId',
      header: $localize`:@@generic-reference-id:Reference ID`,
    },
    {
      field: 'column',
      header: $localize`:@@generic-column:Column`,
    },
    {
      field: 'error',
      header: $localize`:@@generic-error:Error`,
    },
  ]);

  public get DialogState(): typeof DialogState {
    return DialogState;
  }

  public get importExistingRecordsResultKey(): typeof ImportExistingRecordsResultKey {
    return ImportExistingRecordsResultKey;
  }

  getChipLabelByRecordKey(
    importExistingRecordsResultKey: ImportExistingRecordsResultKey,
  ): string {
    return getChipDataByRecordsKey(importExistingRecordsResultKey).chipLabel;
  }

  getChipVariantByRecordKey(
    importExistingRecordsResultKey: ImportExistingRecordsResultKey,
  ): ChipVariant {
    return getChipDataByRecordsKey(importExistingRecordsResultKey).chipVariant;
  }

  resetDialogState(): void {
    this.importState.set(DialogState.NotInitiated);
    this.importExistingRecords.reset();
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  show(): void {
    this.dialogVisible.set(true);
  }
}
