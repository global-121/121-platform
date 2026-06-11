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
  readonly errors = input(err);
  readonly dialogVisible = model(true);

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

export const err = [
  {
    type: 'missing_field',
    attributeName: 'fullName',
    context: "for FSP 'visa-debit-card'",
    message:
      "Missing required attribute 'fullName' (for FSP 'visa-debit-card').",
  },
  {
    type: 'missing_field',
    attributeName: 'addressCity',
    context: "for FSP 'visa-debit-card'",
    message:
      "Missing required attribute 'addressCity' (for FSP 'visa-debit-card').",
  },
  {
    type: 'missing_field',
    attributeName: 'addressHouseNumber',
    context: "for FSP 'visa-debit-card'",
    message:
      "Missing required attribute 'addressHouseNumber' (for FSP 'visa-debit-card').",
  },
  {
    type: 'missing_field',
    attributeName: 'addressHouseNumberAddition',
    context: "for FSP 'visa-debit-card'",
    message:
      "Missing required attribute 'addressHouseNumberAddition' (for FSP 'visa-debit-card').",
  },
  {
    type: 'missing_field',
    attributeName: 'addressPostalCode',
    context: "for FSP 'visa-debit-card'",
    message:
      "Missing required attribute 'addressPostalCode' (for FSP 'visa-debit-card').",
  },
  {
    type: 'missing_field',
    attributeName: 'addressStreet',
    context: "for FSP 'visa-debit-card'",
    message:
      "Missing required attribute 'addressStreet' (for FSP 'visa-debit-card').",
  },
  {
    type: 'missing_field',
    attributeName: 'phoneNumber',
    context: "for FSP 'visa-debit-card'",
    message:
      "Missing required attribute 'phoneNumber' (for FSP 'visa-debit-card').",
  },
  {
    type: 'missing_field',
    attributeName: 'phoneNumber',
    context: "for FSP 'safaricom'",
    message: "Missing required attribute 'phoneNumber' (for FSP 'safaricom').",
  },
  {
    type: 'missing_field',
    attributeName: 'nationalId',
    context: "for FSP 'safaricom'",
    message: "Missing required attribute 'nationalId' (for FSP 'safaricom').",
  },
  {
    type: 'form_configuration',
    rule: 'missing-english-language',
    message: 'Kobo form must have English (en) as one of the languages.',
  },
  {
    type: 'form_configuration',
    rule: 'missing-fullname-attributes',
    detail: 'fullName',
    message:
      'Kobo form must contain the following name attributes defined in program.fullnameNamingConvention. However the following attributes are missing: fullName',
  },
  {
    type: 'missing_field',
    attributeName: 'phoneNumber',
    context:
      'should be a text type and country code should be included, or program.allowEmptyPhoneNumber must be set to true',
    message:
      "Missing required attribute 'phoneNumber' (should be a text type and country code should be included, or program.allowEmptyPhoneNumber must be set to true).",
  },
  {
    type: 'missing_field',
    attributeName: 'fsp',
    message: "Missing required attribute 'fsp'.",
  },
] as KoboValidationError[];
