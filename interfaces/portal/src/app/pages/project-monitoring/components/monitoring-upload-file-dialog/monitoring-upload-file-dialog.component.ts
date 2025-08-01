import {
  ChangeDetectionStrategy,
  Component,
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

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { FormFieldWrapperComponent } from '~/components/form-field-wrapper/form-field-wrapper.component';
import {
  ImportFileDialogComponent,
  ImportFileDialogFormGroup,
} from '~/components/import-file-dialog/import-file-dialog.component';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

type UploadFileFormGroup =
  (typeof MonitoringUploadFileDialogComponent)['prototype']['uploadFileFormGroup'];

@Component({
  selector: 'app-monitoring-upload-file-dialog',
  imports: [
    ButtonModule,
    ImportFileDialogComponent,
    FormFieldWrapperComponent,
    ReactiveFormsModule,
    InputTextModule,
  ],
  templateUrl: './monitoring-upload-file-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ToastService],
})
export class MonitoringUploadFileDialogComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly toastService = inject(ToastService);

  readonly projectId = input.required<string>();

  readonly dialogVisible = model<boolean>(false);

  uploadFileFormGroup = new FormGroup({
    fileName: new FormControl<string>('', {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  uploadFileFormFieldErrors = generateFieldErrors<UploadFileFormGroup>(
    this.uploadFileFormGroup,
    {
      fileName: genericFieldIsRequiredValidationMessage,
    },
  );

  uploadFileMutation = injectMutation(() => ({
    mutationFn: (
      formValues: ReturnType<ImportFileDialogFormGroup['getRawValue']>,
    ) => {
      const { file } = formValues;

      if (!file) {
        // Should never happen but makes TS happy
        throw new Error('File is required');
      }

      const { fileName } = this.uploadFileFormGroup.getRawValue();

      // XXX: Implement file upload logic
      return Promise.resolve({
        file,
        fileName,
      });
    },
    onSuccess: () => {
      this.dialogVisible.set(false);
      this.toastService.showToast({
        detail: 'File upload not implemented yet.',
        severity: 'warn',
      });
      // XXX: Invalidate files cache
    },
  }));

  uploadFile() {
    this.uploadFileFormGroup.reset();
    this.dialogVisible.set(true);
  }
}
