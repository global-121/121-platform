import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { group } from 'radashi';

import {
  KoboMissingFieldError,
  KoboTypeMismatchError,
  KoboValidationError,
  KoboValidationErrorType,
} from '@121-service/src/kobo/interfaces/kobo-validation-error.interface';

import { QueryTableComponent } from '~/components/query-table/query-table.component';
import { QueryTableColumn } from '~/components/query-table/query-table.types';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-kobo-error-dialog',
  imports: [
    InputTextModule,
    ReactiveFormsModule,
    Dialog,
    Button,
    TableModule,
    QueryTableComponent,
    TagModule,
  ],
  providers: [ToastService],
  templateUrl: './kobo-error-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboErrorDialogComponent {
  readonly programId = input.required<number | string>();
  readonly errors = input<[] | KoboValidationError[]>([]);
  readonly dialogVisible = model(false);

  readonly KoboValidationErrorType = KoboValidationErrorType;

  // Group errors by type to display them in separate sections in the UI.
  readonly groupedErrors = computed(() => {
    if (this.errors().length) {
      return group(this.errors(), (e) => e.type);
    }
    return [];
  });

  // Extract unique missing field names from the errors to display them in a list in the UI.
  readonly uniqueMissingFields = computed(() => {
    const missingFieldErrors = this.errors()
      .filter((error) => error.type === KoboValidationErrorType.MissingField)
      .map((error) => (error as KoboMissingFieldError).attributeName);
    const uniqueFields = new Set(missingFieldErrors);
    return Array.from(uniqueFields);
  });

  // Define the columns for the type mismatch errors table.
  readonly parsedErrorsColumns = computed<
    QueryTableColumn<{ id: number } & KoboTypeMismatchError>[]
  >(() => [
    {
      field: 'attributeName',
      header: $localize`Reference ID`,
    },
    {
      field: 'expectedTypes',
      header: $localize`Expected Types`,
      getCellText: (item) => item.expectedTypes.join(', '),
    },
    {
      field: 'actualType',
      header: $localize`Current Type`,
    },
  ]);

  show() {
    this.dialogVisible.set(true);
  }

  hide() {
    this.dialogVisible.set(false);
  }
}
