import { JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  injectMutation,
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ScrollPanelModule } from 'primeng/scrollpanel';

import { FileUploadControlComponent } from '~/components/file-upload-control/file-upload-control.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { DownloadService } from '~/services/download.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type ImportRegistrationsFormGroup =
  (typeof ImportRegistrationsComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-import-registrations',
  standalone: true,
  imports: [
    ButtonModule,
    DialogModule,
    ReactiveFormsModule,
    FormErrorComponent,
    FileUploadControlComponent,
    JsonPipe,
    ScrollPanelModule,
  ],
  providers: [ToastService],
  templateUrl: './import-registrations.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportRegistrationsComponent {
  projectId = input.required<number>();

  private queryClient = injectQueryClient();
  private downloadService = inject(DownloadService);
  private registrationApiService = inject(RegistrationApiService);
  private toastService = inject(ToastService);

  dialogVisible = model<boolean>(false);

  formGroup = new FormGroup({
    file: new FormControl<File | null>(null, {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors<ImportRegistrationsFormGroup>(
    this.formGroup,
    {
      file: genericFieldIsRequiredValidationMessage,
    },
  );

  downloadImportRegistrationsTemplateMutation = injectMutation(() => ({
    mutationFn: () =>
      this.queryClient.fetchQuery(
        this.registrationApiService.getImportTemplate(this.projectId)(),
      ),
    onSuccess: (csvContents) => {
      this.downloadService.downloadCSV({
        file: csvContents,
        filename: 'import-as-registered-TEMPLATE',
      });
    },
  }));

  importRegistrationsMutation = injectMutation(() => ({
    mutationFn: (
      formValues: ReturnType<ImportRegistrationsFormGroup['getRawValue']>,
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
      this.resetForm();
      this.toastService.showToast({
        summary: $localize`:@@import-registrations-success:Registration(s) imported successfully.`,
      });
    },
  }));

  importRegistrationErrors = computed(() => {
    const error = this.importRegistrationsMutation.failureReason();

    if (error instanceof HttpErrorResponse) {
      if (Array.isArray(error.error)) {
        return error.error as unknown[];
      }

      return [error.error as unknown];
    }

    return undefined;
  });

  resetForm(): void {
    this.formGroup.reset();
    this.importRegistrationsMutation.reset();
  }

  onFormSubmit(): void {
    this.formGroup.markAllAsTouched();

    if (!this.formGroup.valid) {
      return;
    }

    this.importRegistrationsMutation.mutate(this.formGroup.getRawValue());
  }
}
