import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { injectQuery } from 'node_modules/@tanstack/angular-query-experimental/inject-query';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { QueryTableColumn } from '~/components/query-table/query-table.types';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { KoboImportExistingRegistrationsDialogComponent } from '~/pages/program-settings-registration-data/components/kobo-import-existing-registrations-dialog/kobo-import-existing-registration-dialog.component';
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
  readonly detailedErrors = signal('');
  readonly programApiService = inject(ProgramApiService);

  programAttributes = injectQuery(
    this.programApiService.getProgramAttributes({
      programId: this.programId,
      includeProgramRegistrationAttributes: true,
    }),
  );

  readonly koboFormName = signal<string | undefined>(undefined);
  readonly koboErrorDialogVisible = signal(true);

  readonly koboImportExistingDialog =
    viewChild.required<KoboImportExistingRegistrationsDialogComponent>(
      'koboImportExistingDialog',
    );

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
    // this.koboConfigurationDialog().show();
  }
}
