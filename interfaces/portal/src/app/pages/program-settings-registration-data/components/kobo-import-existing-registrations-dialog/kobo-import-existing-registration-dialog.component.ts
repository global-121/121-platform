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
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import {
  ChipVariant,
  ColoredChipComponent,
} from '~/components/colored-chip/colored-chip.component';
import { getChipDataBySubmissionsKey } from '~/components/colored-chip/colored-chip.helper';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { InfoTooltipComponent } from '~/components/info-tooltip/info-tooltip.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import { QueryTableColumn } from '~/components/query-table/query-table.types';
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { DialogState } from '~/pages/program-settings-registration-data/components/kobo-import-existing-registrations-dialog/KoboImportExistingRegistrationsDialogState.enum';
import { ToastService } from '~/services/toast.service';

interface ValidationError {
  referenceId: string;
  column: string;
  error: string;
}

interface ValidationErrorTableRow extends ValidationError {
  id: number;
}

export enum SubmissionKey {
  Failed = 'numberOfSubmissionsFailed',
  Imported = 'numberOfSubmissionsImported',
  Skipped = 'numberOfSubmissionsSkipped',
}

@Component({
  selector: 'app-kobo-import-existing-registration-dialog',
  imports: [
    DialogModule,
    ButtonModule,
    ColoredChipComponent,
    QueryTableComponent,
    FormErrorComponent,
    InfoTooltipComponent,
  ],
  providers: [ToastService],
  templateUrl: './kobo-import-existing-registration-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboImportExistingRegistrationsDialogComponent {
  private readonly koboApiService = inject(KoboApiService);
  private readonly toastService = inject(ToastService);

  readonly importState = signal(DialogState.NotInitiated);
  readonly dialogVisible = model(false);
  readonly programId = input.required<number | string>();

  readonly headerIcon = computed(() => {
    switch (this.importState()) {
      case DialogState.ImportedWithErrors:
        return 'pi pi-exclamation-triangle me-2';
      case DialogState.ImportedWithoutErrors:
        return 'pi pi-check me-2';
      case DialogState.NotInitiated:
        return 'pi pi-download me-2';
      case DialogState.ImportedWithoutSubmissions:
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
      case DialogState.ImportedWithoutSubmissions:
        return $localize`No submissions found`;
    }
  });

  readonly dialogWidth = computed(() =>
    this.importState() === DialogState.ImportedWithErrors ? '70rem' : '42rem',
  );

  readonly noExistingSubmissionsTranslation = computed(() => {
    return $localize`Kobo form ”${this.koboIntegration.data()?.name}” does not have existing registrations. New registrations will be synced to the program automatically.`;
  });

  readonly totalSubmissionsTranslation = computed(() => {
    return $localize`${this.importExistingSubmissions.data()?.numberOfSubmissionsOnForm ?? 0}:count: total submission(s)`;
  });

  // Kobo integration and import existing submissions mutations

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
        this.importState.set(DialogState.ImportedWithErrors);

      if (response.validationErrors.length === 0)
        this.importState.set(DialogState.ImportedWithoutErrors);

      if (response.numberOfSubmissionsOnForm === 0)
        this.importState.set(DialogState.ImportedWithoutSubmissions);
    },
    onError: () => {
      this.toastService.showToast({
        severity: 'error',
        detail: $localize`Error while importing existing Kobo registrations`,
      });
    },
  }));

  // Error table

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

  // Exposing the enum and chip colors to the template

  public get DialogState(): typeof DialogState {
    return DialogState;
  }

  public get SubmissionKey(): typeof SubmissionKey {
    return SubmissionKey;
  }

  // Methods

  getChipLabelBySubmissionKey(submissionKey: SubmissionKey): string {
    return getChipDataBySubmissionsKey(submissionKey).chipLabel;
  }

  getChipVariantBySubmissionKey(submissionKey: SubmissionKey): ChipVariant {
    return getChipDataBySubmissionsKey(submissionKey).chipVariant;
  }

  resetDialogState(): void {
    this.importState.set(DialogState.NotInitiated);
    this.importExistingSubmissions.reset();
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  show(): void {
    this.dialogVisible.set(true);
  }
}
