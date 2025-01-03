import { JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CreateMutationResult } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ScrollPanelModule } from 'primeng/scrollpanel';

import { FileUploadControlComponent } from '~/components/file-upload-control/file-upload-control.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import {
  generateFieldErrors,
  genericFieldIsRequiredValidationMessage,
} from '~/utils/form-validation';

export type ImportFileDialogFormGroup =
  (typeof ImportFileDialogComponent)['prototype']['formGroup'];

@Component({
  selector: 'app-import-file-dialog',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    ButtonModule,
    FormErrorComponent,
    FileUploadControlComponent,
    ScrollPanelModule,
    JsonPipe,
  ],
  templateUrl: './import-file-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFileDialogComponent {
  mutation =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input.required<CreateMutationResult<any, Error, any, any>>();
  accept = input.required<string>();
  header = input.required<string>();
  dialogVisible = model<boolean>(false);

  formGroup = new FormGroup({
    file: new FormControl<File | null>(null, {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors<ImportFileDialogFormGroup>(
    this.formGroup,
    {
      file: genericFieldIsRequiredValidationMessage,
    },
  );

  detailedImportErrors = computed(() => {
    const error = this.mutation().failureReason();

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
    this.mutation().reset();
  }

  onFormSubmit(): void {
    this.formGroup.markAllAsTouched();

    if (!this.formGroup.valid) {
      return;
    }

    this.mutation().mutate(this.formGroup.getRawValue());
  }
}
