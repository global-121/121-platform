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
import { TableCellTransactionEventOverviewComponent } from '~/pages/project-registration-activity-log/components/activity-log-transfer-history-dialog/components/table-cell-transfer-history-overview.component';
import { RtlHelperService } from '~/services/rtl-helper.service';
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
  readonly rtlHelper = inject(RtlHelperService);
  readonly projectId = input.required<string>();
  readonly transactionId = input.required<number>();
  readonly paymentId = input.required<number>();

  private readonly projectApiService = inject(ProjectApiService);

  readonly dialogVisible = model(false);

  readonly dialogHeader = computed(
    () => $localize`Transfer #${this.paymentId()} - transfer history`,
  );

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  readonly tableCellContext = computed<TransferHistoryTableCellContext>(() => ({
    projectId: this.projectId,
    currencyCode: this.currencyCode,
  }));

  transferEventLog = injectQuery(() => ({
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
      component: TableCellTransactionEventOverviewComponent,
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
