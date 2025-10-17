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
import { ProjectApiService } from '~/domains/project/project.api.service';
import { TransactionEvent } from '~/domains/transaction/transaction.model';
import { TableCellTransferHistoryOverviewComponent } from '~/pages/project-registration-activity-log/components/activity-log-transfer-history-dialog/components/table-cell-transfer-history-overview.component';
import { getUniqueUserOptions } from '~/utils/unique-users';

interface TransferHistoryTableCellContext {
  projectId: Signal<string>;
  currencyCode: Signal<string | undefined>;
}

@Component({
  selector: 'app-activity-log-transfer-history-dialog',
  imports: [
    ButtonModule,
    DialogModule,
    ScrollPanelModule,
    SkeletonModule,
    QueryTableComponent,
  ],
  templateUrl: './activity-log-transfer-history-dialog.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogTransferHistoryDialogComponent {
  readonly projectId = input.required<string>();
  readonly transactionId = input.required<number>();
  readonly paymentDate = input.required<string>();

  private readonly projectApiService = inject(ProjectApiService);

  readonly dialogVisible = model(false);

  readonly dialogHeader = computed(
    () => $localize`Transfer ${this.paymentDate()} - transfer history`,
  );

  readonly project = injectQuery(
    this.projectApiService.getProject(this.projectId),
  );
  readonly tableCellContext = computed<TransferHistoryTableCellContext>(() => ({
    projectId: this.projectId,
    currencyCode: this.currencyCode,
  }));

  readonly transferEventLog = injectQuery(() => ({
    ...this.projectApiService.getTransactionEvents({
      projectId: this.projectId,
      transactionId: this.transactionId,
    })(),
    enabled: this.dialogVisible(),
  }));

  readonly transferEvents = computed(
    () => this.transferEventLog.data()?.data ?? [],
  );

  readonly columns = computed<QueryTableColumn<TransactionEvent>[]>(() => [
    {
      header: $localize`Overview`,
      field: 'COMPUTED_FIELD',
      component: TableCellTransferHistoryOverviewComponent,
    },
    {
      field: 'user.username',
      header: $localize`Done by`,
      type: QueryTableColumnType.MULTISELECT,
      options: getUniqueUserOptions(this.transferEvents()),
      displayAsChip: true,
    },
    {
      field: 'created',
      header: $localize`Date and time`,
      type: QueryTableColumnType.DATE,
    },
  ]);

  readonly currencyCode = computed(() => this.project.data()?.currency);
}
