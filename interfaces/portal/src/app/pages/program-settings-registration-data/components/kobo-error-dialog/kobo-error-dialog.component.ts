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
import { group } from 'radashi';

import {
  KoboValidationError,
  KoboValidationErrorType,
} from '@121-service/src/kobo/interfaces/kobo-validation-error.interface';

import { QueryTableColumn } from '~/components/query-table/query-table.types';
import { ToastService } from '~/services/toast.service';

interface ParsedFspAttributeError {
  id: number;
  attributeName: string;
  error: string;
  expectedTypes: string[];
  actualType: string;
}

@Component({
  selector: 'app-kobo-error-dialog',
  imports: [InputTextModule, ReactiveFormsModule, Dialog, Button],
  providers: [ToastService],
  templateUrl: './kobo-error-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KoboErrorDialogComponent {
  readonly programId = input.required<number | string>();
  readonly errors = input<KoboValidationError[]>([]);
  readonly dialogVisible = model(false);

  readonly KoboValidationErrorType = KoboValidationErrorType;

  readonly groupedErrors = computed(() => group(this.errors(), (e) => e.type));

  readonly parsedErrorsColumns = computed<
    QueryTableColumn<ParsedFspAttributeError>[]
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
      header: $localize`Actual Type`,
    },
    {
      field: 'error',
      header: $localize`Error`,
    },
  ]);

  show() {
    console.log('Showing Kobo error dialog with errors:', this.errors());
    this.dialogVisible.set(true);
  }

  hide() {
    this.dialogVisible.set(false);
  }
}
