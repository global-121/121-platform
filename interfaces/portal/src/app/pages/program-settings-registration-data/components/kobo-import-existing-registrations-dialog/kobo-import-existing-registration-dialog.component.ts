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
import { KoboApiService } from '~/domains/kobo/kobo-api.service';
import { ToastService } from '~/services/toast.service';
enum ImportState {
  ImportedWithErrors = 'ImportedWithErrors',
  ImportedWithoutErrors = 'ImportedWithoutErrors',
  NotInitiated = 'NotInitiated',
}

@Component({
  selector: 'app-kobo-import-existing-registration-dialog',
  imports: [DialogModule, ButtonModule, ColoredChipComponent],
  providers: [ToastService],
  templateUrl: './kobo-import-existing-registration-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboImportExistingRegistrationsDialogComponent {
  private readonly koboApiService = inject(KoboApiService);

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
    },
  }));

  public get ImportStates(): typeof ImportState {
    return ImportState;
  }

  setToNotInitiatedState() {
    this.importState.set(ImportState.NotInitiated);
  }

  // This needs to be a close() and a reset()
  closeDialogAndResetDialogState() {
    this.responseDialogVisible.set(false);
    this.setToNotInitiatedState();
    this.importExistingSubmissions.reset();
  }

  show() {
    this.responseDialogVisible.set(true);
  }
}
