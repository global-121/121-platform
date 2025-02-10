import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
} from '@angular/core';

import {
  injectMutation,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';

import {
  ImportFileDialogComponent,
  ImportFileDialogFormGroup,
} from '~/components/import-file-dialog/import-file-dialog.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { DownloadService } from '~/services/download.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-import-registrations',
  imports: [ButtonModule, ImportFileDialogComponent],
  providers: [ToastService],
  templateUrl: './import-registrations.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportRegistrationsComponent {
  readonly projectId = input.required<string>();

  private queryClient = inject(QueryClient);
  private downloadService = inject(DownloadService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  readonly dialogVisible = model<boolean>(false);

  downloadImportRegistrationsTemplateMutation = injectMutation(() => ({
    mutationFn: () =>
      this.queryClient.fetchQuery(
        this.registrationApiService.getImportTemplate(this.projectId)(),
      ),
    onSuccess: (csvContents) => {
      this.downloadService.downloadStringArrayToCSV({
        file: csvContents,
        filename: 'import-as-registered-TEMPLATE',
      });
    },
  }));

  importRegistrationsMutation = injectMutation(() => ({
    mutationFn: (
      formValues: ReturnType<ImportFileDialogFormGroup['getRawValue']>,
    ) => {
      const { file } = formValues;

      if (!file) {
        // Should never happen but makes TS happy
        throw new Error('File is required');
      }

      return this.registrationApiService.importRegistrations({
        projectId: this.projectId,
        file,
      });
    },
    onSuccess: () => {
      void this.registrationApiService.invalidateCache(this.projectId);
      this.dialogVisible.set(false);
      this.toastService.showToast({
        summary: $localize`:@@import-registrations-success:Registration(s) imported successfully.`,
      });
    },
  }));
}
