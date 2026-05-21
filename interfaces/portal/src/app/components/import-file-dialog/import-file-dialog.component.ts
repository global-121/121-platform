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

import { ValidateRegistrationErrorObject } from '@121-service/src/registration/interfaces/validate-registration-error-object.interface';

import { FileUploadControlComponent } from '~/components/file-upload-control/file-upload-control.component';
import { FormErrorComponent } from '~/components/form-error/form-error.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import { QueryTableColumn } from '~/components/query-table/query-table.types';
import { generateFieldErrors } from '~/utils/form-validation';

export type ImportFileDialogFormGroup =
  (typeof ImportFileDialogComponent)['prototype']['formGroup'];

interface DetailedImportError extends ValidateRegistrationErrorObject {
  lineNumber?: number;
  id: number;
}

@Component({
  selector: 'app-import-file-dialog',
  imports: [
    DialogModule,
    ReactiveFormsModule,
    ButtonModule,
    FormErrorComponent,
    FileUploadControlComponent,
    QueryTableComponent,
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
  readonly dialogVisible = model(false);
  readonly additionalFormGroups = input<FormGroup[]>([]);

  formGroup = new FormGroup({
    file: new FormControl<File | null>(null, {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- https://github.com/typescript-eslint/typescript-eslint/issues/1929#issuecomment-618695608
      validators: [Validators.required],
    }),
  });

  formFieldErrors = generateFieldErrors(this.formGroup);

  readonly singleErrorMessage = computed(() => {
    const failureReason = this.mutation().failureReason();
    const errors = (failureReason?.cause as { error: unknown[] }).error;

    if (!isDetailedImportErrorArray(errors)) {
      return errors[0] as string;
    }

    return;
  });

  readonly detailedErrors = computed(() => {
    const failureReason = this.mutation().failureReason();
    const errors = (failureReason?.cause as { error: unknown[] }).error;

    if (isDetailedImportErrorArray(errors)) {
      return errors.map((error: ValidateRegistrationErrorObject, index) => ({
        ...error,
        id: index,
      })) as DetailedImportError[];
    }

    return;
  });

  readonly detailedErrorsColumns = computed<
    QueryTableColumn<DetailedImportError>[]
  >(() => [
    {
      field: 'lineNumber',
      header: $localize`Line number`,
    },
    {
      field: 'column',
      header: $localize`Column`,
    },
    {
      field: 'value',
      header: $localize`Value`,
    },
    {
      field: 'error',
      header: $localize`Error`,
      class: 'max-w-md',
    },
  ]);

  resetForm(): void {
    this.formGroup.reset();
    this.mutation().reset();
  }

  handleClose(): void {
    this.dialogVisible.set(false);
    setTimeout(() => {
      this.resetForm();
    }, 300);
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

const isDetailedImportErrorArray = (
  errors: unknown[],
): errors is ValidateRegistrationErrorObject[] =>
  errors.length > 0 && typeof errors[0] === 'object' && errors[0] !== null;
