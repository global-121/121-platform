import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  Signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SkeletonModule } from 'primeng/skeleton';

import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { TransactionEvent } from '~/domains/transaction/transaction.model';
import { TableCellTransactionHistoryOverviewComponent } from '~/pages/program-registration-activity-log/components/activity-log-transaction-history-dialog/components/table-cell-transaction-history-overview.component';
import { getUniqueUserOptions } from '~/utils/unique-users';

interface TransactionHistoryTableCellContext {
  programId: Signal<string>;
  currencyCode: Signal<string | undefined>;
}

@Component({
  selector: 'app-activity-log-transaction-history-dialog',
  imports: [
    ButtonModule,
    DialogModule,
    ScrollPanelModule,
    SkeletonModule,
    QueryTableComponent,
  ],
  templateUrl: './activity-log-transaction-history-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogTransactionHistoryDialogComponent {
  readonly programId = input.required<string>();
  readonly transactionId = input.required<number>();
  readonly paymentDate = input.required<string>();

  private readonly programApiService = inject(ProgramApiService);

  readonly dialogVisible = model(false);

  readonly dialogHeader = computed(
    () => $localize`Transaction ${this.paymentDate()} - transaction history`,
  );

  readonly program = injectQuery(
    this.programApiService.getProgram(this.programId),
  );
  readonly tableCellContext = computed<TransactionHistoryTableCellContext>(
    () => ({
      programId: this.programId,
      currencyCode: this.currencyCode,
    }),
  );

  readonly transactionEventLog = injectQuery(() => ({
    ...this.programApiService.getTransactionEvents({
      programId: this.programId,
      transactionId: this.transactionId,
    })(),
    enabled: this.dialogVisible(),
  }));

  readonly transactionEvents = computed(
    () => this.transactionEventLog.data()?.data ?? [],
  );

  readonly columns = computed<QueryTableColumn<TransactionEvent>[]>(() => [
    {
      header: $localize`Overview`,
      field: 'COMPUTED_FIELD',
      component: TableCellTransactionHistoryOverviewComponent,
    },
    {
      field: 'user.username',
      header: $localize`Done by`,
      type: QueryTableColumnType.MULTISELECT,
      options: getUniqueUserOptions(this.transactionEvents()),
      displayAsChip: true,
    },
    {
      field: 'created',
      header: $localize`Date and time`,
      type: QueryTableColumnType.DATE,
    },
  ]);

  readonly currencyCode = computed(() => this.program.data()?.currency);
}
