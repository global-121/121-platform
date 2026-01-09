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
import { generateFieldErrors } from '~/utils/form-validation';

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
  readonly mutation =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- couldn't find a way to avoid any here
    input.required<CreateMutationResult<any, Error, any, any>>();
  readonly accept = input.required<string>();
  readonly header = input.required<string>();
  readonly dialogVisible = model<boolean>(false);
  readonly additionalFormGroups = input<FormGroup[]>([]);

  formGroup = new FormGroup({
    file: new FormControl<File | null>(null, {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  readonly detailedImportErrors = computed(() => {
    let error = this.mutation().failureReason();

    if (error instanceof Error && error.cause instanceof HttpErrorResponse) {
      error = error.cause;
    }

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
    this.additionalFormGroups().forEach((formGroup) => {
      formGroup.markAllAsTouched();
    });

    if (
      !this.formGroup.valid ||
      this.additionalFormGroups().some((formGroup) => !formGroup.valid)
    ) {
      return;
    }

    this.mutation().mutate(this.formGroup.getRawValue());
  }
}
