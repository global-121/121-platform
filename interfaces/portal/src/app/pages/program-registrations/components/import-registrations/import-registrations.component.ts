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

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { getChipDataByRegistrationStatus } from '~/components/colored-chip/colored-chip.helper';
import {
  ImportFileDialogComponent,
  ImportFileDialogFormGroup,
} from '~/components/import-file-dialog/import-file-dialog.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { DownloadService } from '~/services/download.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-import-registrations',
  imports: [ButtonModule, ImportFileDialogComponent, ColoredChipComponent],
  providers: [ToastService],
  templateUrl: './import-registrations.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportRegistrationsComponent {
  readonly programId = input.required<string>();
  readonly dialogVisible = model<boolean>(false);

  private queryClient = inject(QueryClient);
  private downloadService = inject(DownloadService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  readonly registeredChipData = getChipDataByRegistrationStatus(
    RegistrationStatusEnum.new,
  );

  downloadImportRegistrationsTemplateMutation = injectMutation(() => ({
    mutationFn: () =>
      this.queryClient.fetchQuery(
        this.registrationApiService.getImportTemplate(this.programId)(),
      ),
    onSuccess: (csvContents) => {
      this.downloadService.downloadStringArrayToCSV({
        file: csvContents,
        filename: 'import-as-new-TEMPLATE',
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
        programId: this.programId,
        file,
      });
    },
    onSuccess: () => {
      this.dialogVisible.set(false);
      this.toastService.showToast({
        detail: $localize`:@@import-registrations-success:Registration(s) imported successfully.`,
      });
    },
  }));
}
