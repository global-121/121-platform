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
import { ProgramApiService } from '~/domains/program/program.api.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';
import { generateFieldErrors } from '~/utils/form-validation';

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
  readonly programId = input.required<string>();

  readonly programApiService = inject(ProgramApiService);
  readonly rtlHelper = inject(RtlHelperService);
  readonly toastService = inject(ToastService);

  readonly dialogVisible = model<boolean>(false);

  uploadFileFormGroup = new FormGroup({
    filename: new FormControl<string>('', {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  uploadFileFormFieldErrors = generateFieldErrors(this.uploadFileFormGroup);

  uploadFileMutation = injectMutation(() => ({
    mutationFn: (
      formValues: ReturnType<ImportFileDialogFormGroup['getRawValue']>,
    ) => {
      const { file } = formValues;

      if (!file) {
        // Should never happen but makes TS happy
        throw new Error('File is required');
      }

      const { filename } = this.uploadFileFormGroup.getRawValue();

      return this.programApiService.uploadProgramAttachment({
        programId: this.programId,
        file,
        filename,
      });
    },
    onSuccess: () => {
      this.dialogVisible.set(false);
      this.toastService.showToast({
        detail: $localize`File uploaded successfully`,
      });
      this.uploadFileFormGroup.reset();
    },
  }));
}
