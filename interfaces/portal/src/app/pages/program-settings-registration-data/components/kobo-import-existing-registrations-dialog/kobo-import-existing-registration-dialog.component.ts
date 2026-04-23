import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import { QueryTableColumn } from '~/components/query-table/query-table.types';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { ToastService } from '~/services/toast.service';

enum ImportState {
  ImportedWithErrors = 'ImportedWithErrors',
  ImportedWithoutErrors = 'ImportedWithoutErrors',
  NotInitiated = 'NotInitiated',
}
interface ValidationError {
  referenceId: string;
  column: string;
  error: string;
}
interface ValidationErrorTableRow extends ValidationError {
  id: number;
}
@Component({
  selector: 'app-kobo-import-existing-registration-dialog',
  imports: [
    DialogModule,
    ButtonModule,
    ColoredChipComponent,
    QueryTableComponent,
    FormErrorComponent,
  ],
  providers: [ToastService],
  templateUrl: './kobo-import-existing-registration-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboImportExistingRegistrationsDialogComponent {
  private readonly koboApiService = inject(KoboApiService);
  private readonly toastService = inject(ToastService);

  readonly importState = signal(ImportState.NotInitiated);
  readonly responseDialogVisible = signal(false);
  readonly programId = input.required<number | string>();

  readonly headerIcon = computed(() => {
    switch (this.importState()) {
      case ImportState.ImportedWithErrors:
        return 'pi pi-exclamation-triangle me-2';
      case ImportState.ImportedWithoutErrors:
        return 'pi pi-check me-2';
      case ImportState.NotInitiated:
        return 'pi pi-download me-2';
    }
  });

  readonly dialogTitle = computed(() => {
    switch (this.importState()) {
      case ImportState.ImportedWithErrors:
        return $localize`Import complete with errors`;
      case ImportState.ImportedWithoutErrors:
        return $localize`Import complete`;
      case ImportState.NotInitiated:
        return $localize`Import existing registrations`;
    }
  });

  readonly dialogWidth = computed(() =>
    this.importState() === ImportState.ImportedWithErrors ? '70rem' : '42rem',
  );

  readonly submissionCountTranslations = computed(() => {
    return {
      totalSubmissions: $localize`${this.importExistingSubmissions.data()?.numberOfSubmissionsOnForm ?? 0}:count: total submission(s)`,
      numberOfSubmissionsImportedChipLabel: $localize`Imported successfully: ${this.importExistingSubmissions.data()?.numberOfSubmissionsImported ?? 0}:count:`,
      // TODO: What is `numberOfSubmissionsSkipped` supposed to be?
      // numberOfSubmissionsSkippedChipLabel: $localize`Submissions skipped: ${this.importExistingSubmissions.data()?.numberOfSubmissionsSkipped ?? 0}:count:`,
      numberOfSubmissionsFailedChipLabel: $localize`Submissions failed: ${this.importExistingSubmissions.data()?.numberOfSubmissionsFailed ?? 0}:count:`,
    };
  });

  // TODO: ADD SUBMISSIONS SKIPPED STATE (?)

  readonly koboIntegration = injectQuery(() => ({
    ...this.koboApiService.getKoboIntegration(this.programId)(),
    enabled: !!this.programId(),
  }));

  readonly importExistingSubmissions = injectMutation(() => ({
    mutationFn: () => {
      return this.koboApiService.importExistingSubmissions(this.programId);
    },
    onSuccess: (response) => {
      if (response.validationErrors.length)
        this.importState.set(ImportState.ImportedWithErrors);

      if (response.validationErrors.length === 0)
        this.importState.set(ImportState.ImportedWithoutErrors);

      // TODO: ADD SUBMISSIONS SKIPPED STATE (?)
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Error while importing existing Kobo registrations`,
      });
    },
  }));

  readonly detailedImportErrors = computed(() => {
    const errors = this.importExistingSubmissions.data()?.validationErrors;

    if (errors?.length) {
      // We need to add a ID because the table expects it, without <app-query-table> throws a typescript error
      const detailedErrorsWithIndexedIds: ValidationErrorTableRow[] =
        errors.map((error: ValidationError, index: number) => ({
          ...error,
          id: index,
        }));

      return detailedErrorsWithIndexedIds;
    }

    return undefined;
  });

  readonly detailedErrorsColumns = computed<
    QueryTableColumn<ValidationErrorTableRow>[]
  >(() => [
    {
      field: 'referenceId',
      header: $localize`Reference ID`,
    },
    {
      field: 'column',
      header: $localize`Column`,
    },
    {
      field: 'error',
      header: $localize`Error`,
    },
  ]);

  public get ImportStates(): typeof ImportState {
    return ImportState;
  }

  resetDialogState() {
    this.importState.set(ImportState.NotInitiated);
    this.importExistingSubmissions.reset();
  }

  closeDialog() {
    this.responseDialogVisible.set(false);
  }

  show() {
    this.responseDialogVisible.set(true);
  }
}
